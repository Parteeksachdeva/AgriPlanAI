from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import CropRecommendationModel, YieldPredictionModel, PricePredictionModel
from contextlib import asynccontextmanager
import os
from rag.retrieve import get_relevant_context
from rag.generate import generate_answer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL1_DATA = os.path.join(BASE_DIR, "data", "model1_training.csv")
MODEL2_DATA = os.path.join(BASE_DIR, "data", "model2_training.csv")

crop_recommender = CropRecommendationModel(MODEL1_DATA)
yield_predictor = YieldPredictionModel(MODEL1_DATA)
price_predictor = PricePredictionModel(MODEL2_DATA)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up — training models...")
    try:
        crop_recommender.train()
        yield_predictor.train()
        price_predictor.train()
        print("All models ready.")
    except Exception as e:
        print(f"Error during model training: {e}")
    yield
    print("Shutting down.")


app = FastAPI(title="AgriPlanAI — Crop Recommendation System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ──────────────────────────────────────────────

class PredictionInput(BaseModel):
    state: str
    season: str
    annual_rainfall: float
    fertilizer: float
    pesticide: float
    area: float
    n_soil: float = None
    p_soil: float = None
    k_soil: float = None
    temperature: float = None
    humidity: float = None
    ph: float = None
    top_n: int = 5


class CropResult(BaseModel):
    crop: str
    predicted_yield: float    # t/ha
    avg_price: float          # INR/quintal
    expected_revenue: float   # INR  (yield_t/ha × area × 10 quintals/t × price/quintal)
    suitability: str          # 'traditional', 'common', or 'rare'


class PredictionOutput(BaseModel):
    recommendations: list[CropResult]


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    context_used: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput):
    """
    Pipeline:
      1. Model 1a  → top-N crop recommendations (classification) using Kaggle features
      2. Model 1b  → predicted yield per crop (regression or fallback)
      3. Model 2   → predicted mandi price per crop (regression, INR/quintal)
      4. Suitability → Check if crop is historically grown in the state
      5. App layer → expected_revenue = yield × area × 10 × avg_price
    """
    try:
        input_dict = data.model_dump()
        top_n = input_dict.pop("top_n")
        selected_state = input_dict.get('state', 'Punjab')

        # Map API fields to Model features
        # Note: Kaggle model expect 'rainfall', API sends 'annual_rainfall'
        base_features = {
            'n_soil': input_dict.get('n_soil'),
            'p_soil': input_dict.get('p_soil'),
            'k_soil': input_dict.get('k_soil'),
            'temperature': input_dict.get('temperature'),
            'humidity': input_dict.get('humidity'),
            'ph': input_dict.get('ph'),
            'rainfall': input_dict.get('annual_rainfall'),
            'area': input_dict.get('area')
        }

        # Step 1 — crop recommendations
        # Increase n significantly to 25 (max classes) to ensure we find seasonal/traditional matches
        # even if current soil conditions (like pH) favor other crops in the raw classifier.
        top_crops = crop_recommender.predict_top_n(base_features, n=25)

        results = []
        user_season = input_dict.get('season', 'Whole Year')

        for item in top_crops:
            crop = item["crop"]

            # Filter by season (Kharif/Rabi/Whole Year)
            crop_season = price_predictor.get_crop_season(crop)
            
            # Step 1.1 — Suitability check (needed early for seasonal filtering)
            suitability = price_predictor.get_suitability(state=selected_state, crop=crop)

            # Strict Seasonal Filtering:
            # 1. If user picks a specific season (Rabi/Kharif), exclude crops from the opposite season.
            if user_season in ["Rabi", "Kharif"] and crop_season in ["Rabi", "Kharif"] and crop_season != user_season:
                continue
            
            # 2. If user picks a specific season, only allow "Whole Year" crops if they are Traditional or Common.
            # This prevents "Coconut" or "Coffee" (Whole Year) from showing in Punjab Rabi (Rare).
            if user_season != "Whole Year" and crop_season == "Whole Year" and suitability == "rare":
                continue

            # Step 2 — yield prediction for this crop
            predicted_yield = yield_predictor.predict({**base_features, 'crop': crop})

            # Step 3 — mandi price prediction for this crop in the given state
            avg_price = price_predictor.predict(
                state=selected_state, crop=crop
            )

            # Step 4.0 — Environmental Safety Check (Rainfall, pH, etc.)
            env_score = price_predictor.check_environmental_suitability(
                crop, 
                input_dict.get('annual_rainfall', 0),
                input_dict.get('ph')
            )
            
            # If environmental score is very low, we skip or heavily penalize
            if env_score < 0.05:
                continue

            # Step 5 — revenue: yield(t/ha) × area(ha) × 10(quintal/t) × price(INR/quintal)
            # Apply environmental penalty. 
            # Soften penalty for traditional crops: use env_score instead of env_score^2
            # This acknowledges that farmers can fix soil (pH/nutrients) for their staple crops.
            penalty = env_score if suitability == "traditional" else (env_score ** 2)
            expected_revenue = predicted_yield * input_dict['area'] * 10 * avg_price * penalty

            results.append(CropResult(
                crop=crop,
                predicted_yield=round(predicted_yield, 3),
                avg_price=round(avg_price, 2),
                expected_revenue=round(expected_revenue, 2),
                suitability=suitability,
            ))

        # Balanced Ranking: Suitability weighting revenue
        # Boost traditional crops even more (3.0x) to ensure they show up as top picks.
        suitability_map = {"traditional": 3.0, "common": 1.5, "rare": 0.5}
        results.sort(key=lambda x: suitability_map.get(x.suitability, 0) * x.expected_revenue, reverse=True)
        return PredictionOutput(recommendations=results[:top_n])

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    try:
        context = get_relevant_context(request.question)
        answer = generate_answer(request.question, context)
        return AskResponse(answer=answer, context_used=context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@app.get("/")
def read_root():
    return {"message": "AgriPlanAI API is running."}
