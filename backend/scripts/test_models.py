import os
import sys

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from model import CropRecommendationModel, YieldPredictionModel, PricePredictionModel

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(SCRIPT_DIR, "..")
MODEL1_DATA = os.path.join(BACKEND_DIR, "data", "model1_training.csv")
MODEL2_DATA = os.path.join(BACKEND_DIR, "data", "model2_training.csv")

try:
    print("Testing CropRecommendationModel...")
    crop_recommender = CropRecommendationModel(MODEL1_DATA)
    crop_recommender.train()
    print("Success: CropRecommendationModel trained.")
    print("Classes:", crop_recommender.classes_)

    print("\nTesting YieldPredictionModel...")
    yield_predictor = YieldPredictionModel(MODEL1_DATA)
    yield_predictor.train()
    print("Success: YieldPredictionModel trained.")

    print("\nTesting PricePredictionModel...")
    price_predictor = PricePredictionModel(MODEL2_DATA)
    price_predictor.train()
    print("Success: PricePredictionModel trained.")
    print("Commodity match for 'wheat':", price_predictor.get_commodity_mapping('wheat'))
    print("Season for 'wheat':", price_predictor.get_crop_season('wheat'))
    print("Season for 'rice':", price_predictor.get_crop_season('rice'))

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
