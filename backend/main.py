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
      1. Model 1a  → top-N crop recommendations (classification)
      2. Model 1b  → predicted yield per crop (regression, t/ha)
      3. Model 2   → predicted mandi price per crop (regression, INR/quintal)
      4. App layer → expected_revenue = yield × area × 10 × avg_price
      5. Return list sorted by expected_revenue descending
    """
    try:
        input_dict = data.model_dump()
        top_n = input_dict.pop("top_n")

        base_features = {k: input_dict[k] for k in [
            'state', 'season', 'annual_rainfall', 'fertilizer', 'pesticide',
            'area', 'n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph'
        ]}

        # Step 1 — crop recommendations
        top_crops = crop_recommender.predict_top_n(base_features, n=top_n)

        results = []
        for item in top_crops:
            crop = item["crop"]

            # Step 2 — yield prediction for this crop
            predicted_yield = yield_predictor.predict({**base_features, 'crop': crop})

            # Step 3 — mandi price prediction for this crop in the given state
            avg_price = price_predictor.predict(
                state=input_dict['state'], crop=crop
            )

            # Step 4 — revenue: yield(t/ha) × area(ha) × 10(quintal/t) × price(INR/quintal)
            expected_revenue = predicted_yield * input_dict['area'] * avg_price

            results.append(CropResult(
                crop=crop,
                predicted_yield=round(predicted_yield, 3),
                avg_price=round(avg_price, 2),
                expected_revenue=round(expected_revenue, 2),
            ))

        results.sort(key=lambda x: x.expected_revenue, reverse=True)
        return PredictionOutput(recommendations=results)

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
