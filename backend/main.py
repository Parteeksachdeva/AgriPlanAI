from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from model import CropYieldModel
from contextlib import asynccontextmanager
import os

# Define Data Directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "crop_data.csv")

# Initialize Model
model = CropYieldModel(data_path=DATA_PATH)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Train model on startup
    print("Starting up and training model...")
    try:
        model.train()
    except Exception as e:
        print(f"Error during model training: {e}")
    yield
    print("Shutting down...")

app = FastAPI(title="Crop Yield Recommendation System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionInput(BaseModel):
    rainfall: float
    temperature: float = Field(None, alias="averageTemperature")
    soil_type: str
    irrigation: int
    season: str
    crop: str

class CropRecommendation(BaseModel):
    crop: str
    expected_profit: float

class PredictionOutput(BaseModel):
    predicted_yield: float
    expected_profit: float
    top_3_crops: list[CropRecommendation]

# Static reference data for Indian agriculture contexts (per hectare basis, example values)
CROP_COST = {
    "Wheat": 25000, 
    "Rice": 30000, 
    "Maize": 20000,
    "Mustard": 15000,
    "Soybean": 22000
}

AVERAGE_MANDI_PRICE = {
    "Wheat": 2200,   # Price per quintal (~100kg), assuming yield in tonnes -> 22000/tonne
    "Rice": 2500,    # 25000/tonne
    "Maize": 1800,   # 18000/tonne
    "Mustard": 5000, # 50000/tonne
    "Soybean": 4500  # 45000/tonne
}

@app.post("/predict", response_model=PredictionOutput)
def predict_yield(data: PredictionInput):
    try:
        input_dict = getattr(data, "model_dump", data.dict)()
        
        # 1. Predict for the requested crop
        requested_crop = input_dict["crop"]
        predicted_yield = model.predict(input_dict)
        
        # 2. Calculate requested crop's profit (assuming yield is in tonnes/hectare)
        # Convert Mandi price per quintal (100kg = 0.1 tonne) to price per tonne
        price_per_tonne = AVERAGE_MANDI_PRICE.get(requested_crop, 0) * 10
        cost_per_hectare = CROP_COST.get(requested_crop, 0)
        expected_profit = (predicted_yield * price_per_tonne) - cost_per_hectare
        
        # 3. Recommend the top 3 crops for the same conditions based on profitability
        all_crops = list(CROP_COST.keys())
        profit_scores = []
        
        for crop in all_crops:
            # Substitute the crop feature and generate a prediction
            test_input = input_dict.copy()
            test_input["crop"] = crop
            
            crop_yield = model.predict(test_input)
            
            # Predict profit
            c_price_per_tonne = AVERAGE_MANDI_PRICE.get(crop, 0) * 10
            c_cost = CROP_COST.get(crop, 0)
            c_profit = (crop_yield * c_price_per_tonne) - c_cost
            
            profit_scores.append({"crop": crop, "expected_profit": c_profit})
            
        # Sort and take top 3
        profit_scores.sort(key=lambda x: x["expected_profit"], reverse=True)
        top_3 = profit_scores[:3]

        return PredictionOutput(
            predicted_yield=predicted_yield,
            expected_profit=expected_profit, 
            top_3_crops=top_3
        )
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/feature-importance")
def get_feature_importance():
    try:
        importances = model.get_feature_importance()
        return {"feature_importance": importances}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feature importance: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Crop Yield Recommendation System API is running."}
