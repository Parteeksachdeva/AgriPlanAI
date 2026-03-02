from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import CropRecommendationModel, YieldPredictionModel, PricePredictionModel
from model_enhanced import StateAwareYieldModel, EnhancedPricePredictionModel, get_state_aware_yield_model, get_enhanced_price_model
from price_prediction import MandiPricePredictor
from rotation_planner import get_rotation_planner
from weather_service import get_weather_service
from contextlib import asynccontextmanager
import os
import joblib
from rag.retrieve import get_relevant_context
from rag.generate import generate_answer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL1_DATA = os.path.join(BASE_DIR, "data", "model1_training.csv")
MODEL1_ENHANCED_DATA = os.path.join(BASE_DIR, "data", "model1_training_enhanced.csv")
MODEL2_DATA = os.path.join(BASE_DIR, "data", "model2_training_extended.csv")
YIELDS_DATA = os.path.join(BASE_DIR, "data", "state_crop_yields.csv")
CACHE_DIR = os.path.join(BASE_DIR, "model_cache")

# Original models (fallback)
crop_recommender = CropRecommendationModel(MODEL1_DATA)
yield_predictor = YieldPredictionModel(MODEL1_DATA)
price_predictor = PricePredictionModel(MODEL2_DATA)
mandi_price_predictor = MandiPricePredictor(MODEL2_DATA)

# Enhanced models (primary)
enhanced_yield_model = None
enhanced_price_model = None
weather_service = None


def _cache_valid(cache_path: str, *data_paths: str) -> bool:
    """Returns True if the cache file is newer than all given data files."""
    if not os.path.exists(cache_path):
        return False
    cache_mtime = os.path.getmtime(cache_path)
    return all(cache_mtime > os.path.getmtime(p) for p in data_paths if os.path.exists(p))


def _load_or_train(model, cache_file: str, train_fn, *data_paths: str):
    """Load model state from cache if valid, otherwise train and save."""
    cache_path = os.path.join(CACHE_DIR, cache_file)
    if _cache_valid(cache_path, *data_paths):
        print(f"Loading {cache_file} from cache...")
        model.__dict__.update(joblib.load(cache_path).__dict__)
    else:
        train_fn()
        joblib.dump(model, cache_path)
        print(f"Trained and cached {cache_file}.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global enhanced_yield_model, enhanced_price_model, weather_service
    print("Starting up — training models...")
    try:
        # Train original models
        crop_recommender.train()
        yield_predictor.train()
        price_predictor.train()
        mandi_price_predictor.load_data()
        
        # Initialize enhanced models
        print("Initializing enhanced models...")
        enhanced_yield_model = get_state_aware_yield_model()
        enhanced_price_model = get_enhanced_price_model()
        
        # Initialize weather service
        print("Initializing weather service...")
        weather_service = get_weather_service()
        
        print("All models ready.")
    except Exception as e:
        print(f"Error during model training: {e}")
        import traceback
        traceback.print_exc()
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
    language: str = "en"  # 'en' or 'hi'
    current_recommendations: list[CropResult] = []
    form_data: dict = {}


class AskResponse(BaseModel):
    answer: str
    context_used: str


class PricePredictionRequest(BaseModel):
    commodity: str
    state: str
    days_ahead: int = 7


class PricePredictionResponse(BaseModel):
    commodity: str
    state: str
    current_price: float
    predicted_price: float
    price_change_pct: float
    confidence_interval: dict
    prediction_date: str
    days_ahead: int
    recommendation: str
    recommendation_reason: str
    confidence_score: str
    price_trend: str
    volatility_level: str


class PriceHistoryResponse(BaseModel):
    commodity: str
    state: str
    history: list[dict]


class MarketInsightsResponse(BaseModel):
    commodity: str
    state: str
    average_price: float
    price_range: dict
    volatility: float
    trend: float
    recent_average: float
    price_stability: str
    available_states: list[str]


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput):
    """
    Pipeline:
      1. Model 1a  → top-N crop recommendations (classification) using Kaggle features
      2. Model 1b  → predicted yield per crop (regression or fallback)
      3. Model 2   → predicted mandi price per crop (regression, INR/quintal)
      4. Suitability → Check if crop is historically grown in the state
      5. App layer → expected_revenue = yield x area x avg_price
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

            # Step 2 — yield prediction using enhanced state-aware model
            if enhanced_yield_model:
                yield_result = enhanced_yield_model.predict(
                    {**base_features, 'crop': crop, 'state': selected_state},
                    return_confidence=True
                )
                predicted_yield = yield_result['yield_t_ha']
            else:
                predicted_yield = yield_predictor.predict({**base_features, 'crop': crop}, state=selected_state)

            # Step 3 — mandi price prediction using enhanced price model
            if enhanced_price_model:
                price_result = enhanced_price_model.predict_price(
                    commodity=crop,
                    state=selected_state,
                    include_factors=True
                )
                avg_price = price_result['predicted_price']
            else:
                avg_price = price_predictor.predict(state=selected_state, crop=crop)

            # Step 4.0 — Environmental Safety Check (Rainfall, pH, etc.)
            env_score = price_predictor.check_environmental_suitability(
                crop, 
                input_dict.get('annual_rainfall', 0),
                input_dict.get('ph')
            )
            
            # Skip crops that are environmentally very unsuitable.
            # check_environmental_suitability floor is 0.1; < 0.15 means two severe penalties.
            if env_score < 0.15:
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

        # Balanced Ranking: nudge traditional/common crops up without drowning ML signal.
        suitability_map = {"traditional": 2.0, "common": 1.2, "rare": 0.7}
        results.sort(key=lambda x: suitability_map.get(x.suitability, 1.0) * x.expected_revenue, reverse=True)
        return PredictionOutput(recommendations=results[:top_n])

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    try:
        # Get context from RAG (PDF documents)
        pdf_context = get_relevant_context(request.question)
        
        # Build screen context from current recommendations
        screen_context = ""
        if request.current_recommendations:
            screen_context = "Current Crop Recommendations:\n"
            for i, rec in enumerate(request.current_recommendations[:5], 1):
                screen_context += f"{i}. {rec.crop}: {rec.predicted_yield:.2f} tonnes/hectare, ₹{rec.avg_price:.0f}/quintal, ₹{rec.expected_revenue:.0f} expected revenue ({rec.suitability})\n"
        
        if request.form_data:
            screen_context += "\nFarm Details:\n"
            for key, value in request.form_data.items():
                if value is not None:
                    screen_context += f"- {key}: {value}\n"
        
        # Combine PDF context with screen context
        combined_context = f"{pdf_context}\n\n{screen_context}" if pdf_context else screen_context
        
        answer = generate_answer(
            question=request.question,
            context=combined_context,
            language=request.language,
            has_pdf_context=bool(pdf_context),
            form_data=request.form_data
        )
        return AskResponse(answer=answer, context_used=combined_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@app.get("/")
def read_root():
    return {"message": "AgriPlanAI API is running."}


# ── Price Prediction Endpoints ──────────────────────────────────────────────

@app.post("/api/price-prediction", response_model=PricePredictionResponse)
def get_price_prediction(request: PricePredictionRequest):
    """
    Predict future mandi prices and provide sell recommendations.
    Uses enhanced price model with state-specific data when available.
    """
    try:
        # Try enhanced model first
        if enhanced_price_model:
            result = enhanced_price_model.predict_price(
                commodity=request.commodity,
                state=request.state,
                days_ahead=request.days_ahead,
                include_factors=True
            )
            
            # Map to response format
            prediction = {
                'commodity': result['commodity'],
                'state': result['state'],
                'current_price': result['predicted_price'],  # Use predicted as current for now
                'predicted_price': result['predicted_price'],
                'price_change_pct': 0.0,
                'confidence_interval': result['confidence_interval'],
                'prediction_date': datetime.now().strftime('%Y-%m-%d'),
                'days_ahead': request.days_ahead,
                'recommendation': 'HOLD',
                'recommendation_reason': f"Price confidence is {result['confidence']}",
                'confidence_score': result['confidence'].upper(),
                'price_trend': 'STABLE',
                'volatility_level': 'MEDIUM'
            }
        else:
            # Fallback to original model
            prediction = mandi_price_predictor.predict_price(
                commodity=request.commodity,
                state=request.state,
                days_ahead=request.days_ahead
            )
        
        if prediction.get('current_price') is None:
            raise HTTPException(
                status_code=404, 
                detail=f"No price data available for {request.commodity} in {request.state}"
            )
            
        return PricePredictionResponse(**prediction)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price prediction failed: {str(e)}")


@app.get("/api/price-history/{commodity}/{state}")
def get_price_history(commodity: str, state: str, days: int = 30):
    """
    Get historical price data for a commodity in a state.
    """
    try:
        history = mandi_price_predictor.get_price_history(commodity, state, days)
        
        if not history:
            raise HTTPException(
                status_code=404,
                detail=f"No price history available for {commodity} in {state}"
            )
            
        return PriceHistoryResponse(
            commodity=commodity,
            state=state,
            history=history
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch price history: {str(e)}")


@app.get("/api/market-insights/{commodity}/{state}")
def get_market_insights(commodity: str, state: str):
    """
    Get comprehensive market insights for a commodity.
    """
    try:
        insights = mandi_price_predictor.get_market_insights(commodity, state)
        
        if 'error' in insights:
            raise HTTPException(status_code=404, detail=insights['error'])
            
        return MarketInsightsResponse(**insights)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market insights: {str(e)}")


# ── AI Analysis Endpoint ────────────────────────────────────────────────────

class AIAnalysisRequest(BaseModel):
    crop: str
    state: str
    season: str
    annual_rainfall: float
    n_soil: float = None
    p_soil: float = None
    k_soil: float = None
    temperature: float = None
    humidity: float = None
    ph: float = None


class FeatureImportance(BaseModel):
    feature: str
    importance: float
    impact: str  # 'positive', 'negative', 'neutral'


class AIAnalysisResponse(BaseModel):
    crop: str
    confidence_score: float
    crop_rank: int
    total_crops_considered: int
    feature_importance: list[FeatureImportance]
    yield_factors: dict
    price_trend: str
    market_volatility: str
    recommendation_strength: str


@app.post("/api/ai-analysis", response_model=AIAnalysisResponse)
def get_ai_analysis(request: AIAnalysisRequest):
    """
    Get real AI analysis using ML model internals:
    - Feature importance from XGBoost
    - Model prediction confidence
    - Yield factor breakdown
    - Market trend analysis
    """
    try:
        # 1. Get crop recommendation probability from ML model
        base_features = {
            'n_soil': request.n_soil or 80,
            'p_soil': request.p_soil or 50,
            'k_soil': request.k_soil or 50,
            'temperature': request.temperature or 25,
            'humidity': request.humidity or 70,
            'ph': request.ph or 6.5,
            'rainfall': request.annual_rainfall
        }
        
        # Get prediction probability for this specific crop
        crop_probs = crop_recommender.predict_top_n(base_features, n=25)
        crop_match = next((c for c in crop_probs if c['crop'] == request.crop), None)
        raw_probability = crop_match['probability'] if crop_match else 0.0
        
        # Calculate rank of this crop (1 = top recommendation)
        crop_rank = next((i+1 for i, c in enumerate(crop_probs) if c['crop'] == request.crop), 99)
        
        # Calculate gap to top probability (how close is this crop to #1?)
        top_probability = crop_probs[0]['probability'] if crop_probs else 0
        probability_gap = top_probability - raw_probability
        
        # 2. Extract feature importance from XGBoost model
        feature_importance = []
        if hasattr(crop_recommender.pipeline, 'named_steps') and 'classifier' in crop_recommender.pipeline.named_steps:
            classifier = crop_recommender.pipeline.named_steps['classifier']
            if hasattr(classifier, 'feature_importances_'):
                # Get feature names from preprocessor
                preprocessor = crop_recommender.pipeline.named_steps['preprocessor']
                feature_names = []
                for name, trans, cols in preprocessor.transformers_:
                    if name == 'num':
                        feature_names.extend(cols)
                
                importances = classifier.feature_importances_
                if len(feature_names) == len(importances):
                    for feat, imp in zip(feature_names, importances):
                        # Determine impact based on user's value vs optimal
                        user_val = base_features.get(feat, 0)
                        impact = 'neutral'
                        if feat in ['n_soil', 'p_soil', 'k_soil']:
                            optimal = {'n_soil': 80, 'p_soil': 50, 'k_soil': 50}
                            opt = optimal.get(feat, 50)
                            impact = 'positive' if abs(user_val - opt) < 20 else 'negative' if user_val < opt * 0.6 else 'neutral'
                        elif feat == 'ph':
                            impact = 'positive' if 6.0 <= user_val <= 7.0 else 'negative' if user_val < 5.5 or user_val > 7.5 else 'neutral'
                        elif feat == 'rainfall':
                            impact = 'positive' if 800 <= user_val <= 1500 else 'negative' if user_val < 500 else 'neutral'
                        
                        feature_importance.append(FeatureImportance(
                            feature=feat.replace('_', ' ').title(),
                            importance=round(float(imp) * 100, 2),
                            impact=impact
                        ))
        
        # Sort by importance
        feature_importance.sort(key=lambda x: x.importance, reverse=True)
        
        # 3. Calculate yield factors breakdown using enhanced model
        yield_factors = {
            'base_yield': 2.5,
            'npk_factor': 1.0,
            'climate_factor': 1.0,
            'soil_factor': 1.0,
            'data_source': 'fallback',
            'confidence': 'low'
        }
        
        # Use enhanced yield model if available
        if enhanced_yield_model:
            yield_input = {
                'state': request.state,
                'crop': request.crop,
                'n_soil': request.n_soil or 80,
                'p_soil': request.p_soil or 50,
                'k_soil': request.k_soil or 50,
                'temperature': request.temperature or 25,
                'humidity': request.humidity or 70,
                'ph': request.ph or 6.5,
                'rainfall': request.annual_rainfall
            }
            yield_result = enhanced_yield_model.predict(yield_input, return_confidence=True)
            
            yield_factors['base_yield'] = yield_result['factors']['base_yield']
            yield_factors['npk_factor'] = yield_result['factors']['npk_factor']
            yield_factors['climate_factor'] = yield_result['factors']['climate_factor']
            yield_factors['data_source'] = yield_result['data_source']
            yield_factors['confidence'] = yield_result['confidence']
            yield_factors['predicted_yield'] = yield_result['yield_t_ha']
        else:
            # NPK factor calculation (same as model.py) - fallback
            n = request.n_soil or 80
            p = request.p_soil or 50
            k = request.k_soil or 50
            
            if n < 80:
                yield_factors['npk_factor'] *= (0.7 + 0.3 * (n / 80))
            else:
                yield_factors['npk_factor'] *= min(1.12, 1.0 + 0.12 * ((n - 80) / 80))
                
            if p < 50:
                yield_factors['npk_factor'] *= (0.75 + 0.25 * (p / 50))
            else:
                yield_factors['npk_factor'] *= min(1.08, 1.0 + 0.08 * ((p - 50) / 50))
                
            if k < 50:
                yield_factors['npk_factor'] *= (0.80 + 0.20 * (k / 50))
            else:
                yield_factors['npk_factor'] *= min(1.10, 1.0 + 0.10 * ((k - 50) / 50))
        
        # Climate factor - more realistic variation based on rainfall
        # Crop water requirements vary significantly
        rainfall = request.annual_rainfall
        crop = request.crop.lower()
        
        # Get crop-specific rainfall requirements from metadata
        meta = price_predictor.crop_metadata.get(crop, {})
        min_rf = meta.get('min_rainfall', 500)
        max_rf = meta.get('max_rainfall', 1500)
        
        if rainfall < min_rf * 0.5:
            # Severe deficit - major yield loss
            yield_factors['climate_factor'] = 0.60
        elif rainfall < min_rf * 0.8:
            # Moderate deficit
            yield_factors['climate_factor'] = 0.75
        elif rainfall < min_rf:
            # Slight deficit
            yield_factors['climate_factor'] = 0.88
        elif rainfall > max_rf * 1.5:
            # Excess rainfall - flooding risk
            yield_factors['climate_factor'] = 0.70
        elif rainfall > max_rf:
            # Above optimal
            yield_factors['climate_factor'] = 0.90
        else:
            # Optimal range
            yield_factors['climate_factor'] = 1.0
        
        # Soil pH factor - crop-specific optimal ranges
        ph = request.ph or 6.5
        
        # Get crop-specific pH range from metadata
        ph_min = meta.get('ph_min', 5.5)
        ph_max = meta.get('ph_max', 7.5)
        ph_optimal_min = max(ph_min, 6.0)
        ph_optimal_max = min(ph_max, 7.0)
        
        if ph_optimal_min <= ph <= ph_optimal_max:
            # Optimal pH range
            yield_factors['soil_factor'] = 1.0
        elif ph_min <= ph < ph_optimal_min or ph_optimal_max < ph <= ph_max:
            # Acceptable but not optimal
            yield_factors['soil_factor'] = 0.90
        elif (ph_min - 0.5) <= ph < ph_min or ph_max < ph <= (ph_max + 0.5):
            # Marginal - yield reduction expected
            yield_factors['soil_factor'] = 0.75
        else:
            # Outside tolerable range - significant yield loss
            yield_factors['soil_factor'] = 0.55
        
        # 4. Get market trend data
        commodity = price_predictor.get_commodity_mapping(request.crop)
        price_trend = "STABLE"
        market_volatility = "MEDIUM"
        
        if commodity:
            stats = mandi_price_predictor.commodity_stats.get(commodity, {})
            trend_val = stats.get('trend', 0)
            vol_val = stats.get('volatility', 0.2)
            
            price_trend = 'UP' if trend_val > 0.1 else 'DOWN' if trend_val < -0.1 else 'STABLE'
            market_volatility = 'HIGH' if vol_val > 0.3 else 'MEDIUM' if vol_val > 0.15 else 'LOW'
        
        # 5. Calculate overall confidence score
        suitability = price_predictor.get_suitability(request.state, request.crop)
        suitability_score = {'traditional': 0.95, 'common': 0.80, 'rare': 0.65}.get(suitability, 0.65)
        
        # Better confidence calculation based on RANK and PROXIMITY to top choice
        # Farmers care about: Is this crop in the top recommendations? How close to #1?
        
        # Base confidence from rank (top 3 = good)
        if crop_rank == 1:
            rank_score = 95
        elif crop_rank == 2:
            rank_score = 88
        elif crop_rank == 3:
            rank_score = 80
        elif crop_rank <= 5:
            rank_score = 70
        else:
            rank_score = 55
        
        # Bonus for being close to top probability (within 5% = very similar suitability)
        if probability_gap < 0.02:  # Within 2%
            proximity_bonus = 5
        elif probability_gap < 0.05:  # Within 5%
            proximity_bonus = 3
        else:
            proximity_bonus = 0
        
        # Regional suitability bonus
        suitability_bonus = {'traditional': 5, 'common': 2, 'rare': 0}.get(suitability, 0)
        
        confidence_score = min(98, rank_score + proximity_bonus + suitability_bonus)
        
        # Recommendation strength - farmer-friendly language
        if crop_rank <= 2 and suitability == 'traditional':
            recommendation_strength = "Highly Recommended"
        elif crop_rank <= 3 or suitability == 'traditional':
            recommendation_strength = "Recommended"
        elif crop_rank <= 5:
            recommendation_strength = "Good Alternative"
        else:
            recommendation_strength = "Consider with Caution"
        
        return AIAnalysisResponse(
            crop=request.crop,
            confidence_score=round(confidence_score, 1),
            crop_rank=crop_rank,
            total_crops_considered=len(crop_probs),
            feature_importance=feature_importance[:5],  # Top 5 features
            yield_factors=yield_factors,
            price_trend=price_trend,
            market_volatility=market_volatility,
            recommendation_strength=recommendation_strength
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ── Crop Rotation Planner Endpoints ─────────────────────────────────────────

class RotationRequest(BaseModel):
    current_crop: str
    season: str
    years: int = 3


class SoilRecoveryRequest(BaseModel):
    current_n: float
    current_p: float
    current_k: float
    target_crop: str


@app.post("/api/rotation-plan")
def get_rotation_plan(request: RotationRequest):
    """
    Get optimal crop rotation plans for multi-season planning.
    Includes soil health impact and 3-year profit projections.
    """
    try:
        planner = get_rotation_planner()
        rotations = planner.get_compatible_rotations(
            request.current_crop,
            request.season,
            request.years
        )
        
        if not rotations:
            raise HTTPException(
                status_code=404,
                detail=f"No rotation plans found for {request.current_crop}"
            )
        
        return {
            'current_crop': request.current_crop,
            'season': request.season,
            'rotation_options': rotations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rotation planning failed: {str(e)}")


@app.post("/api/soil-recovery-plan")
def get_soil_recovery_plan(request: SoilRecoveryRequest):
    """
    Get soil recovery recommendations before planting a target crop.
    Suggests nitrogen-fixing crops to restore soil health.
    """
    try:
        planner = get_rotation_planner()
        plan = planner.get_soil_recovery_plan(
            request.current_n,
            request.current_p,
            request.current_k,
            request.target_crop
        )
        
        if 'error' in plan:
            raise HTTPException(status_code=404, detail=plan['error'])
        
        return plan
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Soil recovery planning failed: {str(e)}")


@app.get("/api/seasonal-trends/{commodity}/{state}")
def get_seasonal_trends(commodity: str, state: str):
    """
    Get seasonal price trends for a commodity.
    Shows best and worst months to sell.
    """
    try:
        trends = mandi_price_predictor.get_seasonal_trends(commodity, state)
        
        if 'error' in trends:
            raise HTTPException(status_code=404, detail=trends['error'])
        
        return trends
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch seasonal trends: {str(e)}")


@app.get("/api/nearby-mandi-prices/{commodity}/{state}")
def get_nearby_mandi_prices(commodity: str, state: str):
    """
    Get prices from nearby mandis for comparison.
    Helps farmers find the best market to sell.
    """
    try:
        prices = mandi_price_predictor.get_nearby_mandi_prices(commodity, state)
        
        if not prices:
            raise HTTPException(
                status_code=404,
                detail=f"No mandi prices found for {commodity} in {state}"
            )
        
        return {
            'commodity': commodity,
            'state': state,
            'mandi_prices': prices,
            'best_price': prices[0] if prices else None,
            'price_difference': round(prices[0]['latest_price'] - prices[-1]['latest_price'], 2) if len(prices) > 1 else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mandi prices: {str(e)}")


# ── Enhanced Model Data Quality Endpoint ─────────────────────────────────────

@app.get("/api/model-data-quality")
def get_model_data_quality():
    """
    Get information about the data quality and coverage of enhanced models.
    Shows which states and crops have high-confidence predictions.
    """
    try:
        quality_info = {
            'yield_model': {
                'status': 'enhanced' if enhanced_yield_model else 'fallback',
                'state_crop_combinations': len(enhanced_yield_model.state_yield_lookup) if enhanced_yield_model else 0,
                'crops_with_national_avg': len(enhanced_yield_model.crop_national_avg) if enhanced_yield_model else 0,
                'model_trained': enhanced_yield_model.is_trained if enhanced_yield_model else False
            },
            'price_model': {
                'status': 'enhanced' if enhanced_price_model else 'fallback',
                'state_commodity_combinations': len(enhanced_price_model.state_price_lookup) if enhanced_price_model else 0,
                'commodities_with_avg': len(enhanced_price_model.commodity_avg) if enhanced_price_model else 0
            },
            'supported_states': [
                'Tamil Nadu', 'Kerala', 'Gujarat', 'Himachal Pradesh', 'Uttar Pradesh',
                'Haryana', 'Punjab', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
                'West Bengal', 'Bihar', 'Odisha', 'Assam', 'Karnataka', 'Andhra Pradesh',
                'Telangana', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand'
            ],
            'data_sources': [
                'DES (Directorate of Economics & Statistics) - Yield Data 2022-23',
                'Agmarknet - Mandi Price Data 2024',
                'ICAR - Crop Metadata and Nutrient Requirements'
            ]
        }
        
        return quality_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data quality info: {str(e)}")


# ── Weather Integration Endpoints ────────────────────────────────────────────

@app.get("/api/weather/current/{state}")
def get_current_weather(state: str):
    """
    Get current weather conditions for a state.
    Returns temperature, humidity, and rainfall data.
    """
    try:
        if not weather_service:
            raise HTTPException(status_code=503, detail="Weather service not available")
        
        weather = weather_service.get_current_weather(state)
        return weather
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather: {str(e)}")


@app.get("/api/weather/forecast/{state}")
def get_weather_forecast(state: str, days: int = 7):
    """
    Get weather forecast for a state.
    Helps farmers plan irrigation and other activities.
    """
    try:
        if not weather_service:
            raise HTTPException(status_code=503, detail="Weather service not available")
        
        forecast = weather_service.get_weather_forecast(state, days)
        return {
            'state': state,
            'forecast': forecast,
            'days': days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@app.get("/api/weather/yield-adjustment/{state}/{crop}")
def get_weather_yield_adjustment(state: str, crop: str):
    """
    Get yield adjustment factors based on current weather conditions.
    Shows how current weather impacts crop yield potential.
    """
    try:
        if not weather_service:
            raise HTTPException(status_code=503, detail="Weather service not available")
        
        adjustment = weather_service.calculate_yield_adjustment(state, crop)
        return adjustment
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate adjustment: {str(e)}")


@app.get("/api/weather/seasonal-outlook/{state}")
def get_seasonal_weather_outlook(state: str, season: str = 'kharif'):
    """
    Get seasonal weather outlook for a state.
    Helps farmers choose crops based on expected weather patterns.
    """
    try:
        if not weather_service:
            raise HTTPException(status_code=503, detail="Weather service not available")
        
        outlook = weather_service.get_seasonal_weather_outlook(state, season)
        return outlook
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch outlook: {str(e)}")
