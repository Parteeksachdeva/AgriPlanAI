import os
import sys
import pandas as pd

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from model import CropRecommendationModel, YieldPredictionModel, PricePredictionModel

# Paths
MODEL1_DATA = os.path.join(BASE_DIR, "data", "model1_training.csv")
MODEL2_DATA = os.path.join(BASE_DIR, "data", "model2_training.csv")

# Initialize models
crop_recommender = CropRecommendationModel(MODEL1_DATA)
yield_predictor = YieldPredictionModel(MODEL1_DATA)
price_predictor = PricePredictionModel(MODEL2_DATA)

# Train models
print("Training models...")
crop_recommender.train()
yield_predictor.train()
price_predictor.train()
print("All models ready.\n")

scenarios = [
    {
        "name": "0. Punjab User Scenario (Kharif)",
        "inputs": {
            "state": "Punjab", "season": "Kharif", "n_soil": 80, "p_soil": 50, "k_soil": 40,
            "temperature": 25, "humidity": 70, "ph": 6.5, "annual_rainfall": 800, "area": 1.0
        }
    },
    {
        "name": "1. Punjab Wheat Belt (Rabi)",
        "inputs": {
            "state": "Punjab", "season": "Rabi", "n_soil": 80, "p_soil": 60, "k_soil": 40,
            "temperature": 15, "humidity": 50, "ph": 7.0, "annual_rainfall": 500, "area": 1.0
        }
    },
    {
        "name": "2. Kerala Tropical (Kharif)",
        "inputs": {
            "state": "Kerala", "season": "Kharif", "n_soil": 60, "p_soil": 40, "k_soil": 30,
            "temperature": 30, "humidity": 90, "ph": 6.5, "annual_rainfall": 2000, "area": 1.0
        }
    },
    {
        "name": "3. Dry/Arid Conditions",
        "inputs": {
            "state": "Rajasthan", "season": "Whole Year", "n_soil": 30, "p_soil": 20, "k_soil": 10,
            "temperature": 40, "humidity": 20, "ph": 7.5, "annual_rainfall": 300, "area": 1.0
        }
    },
    {
        "name": "4. Acidic Soil",
        "inputs": {
            "state": "Assam", "season": "Whole Year", "n_soil": 20, "p_soil": 10, "k_soil": 10,
            "temperature": 25, "humidity": 80, "ph": 4.5, "annual_rainfall": 1500, "area": 1.0
        }
    },
    {
        "name": "5. High Fertility Soil",
        "inputs": {
            "state": "Uttar Pradesh", "season": "Whole Year", "n_soil": 120, "p_soil": 100, "k_soil": 80,
            "temperature": 28, "humidity": 70, "ph": 6.8, "annual_rainfall": 1000, "area": 1.0
        }
    }
]

def run_test(scenario, silent=False):
    if not silent: print(f"=== {scenario['name']} ===")
    data = scenario['inputs']
    top_n = 5
    selected_state = data.get('state', 'Punjab')
    area = data.get('area', 1.0)
    
    base_features = {
        'n_soil': data.get('n_soil'),
        'p_soil': data.get('p_soil'),
        'k_soil': data.get('k_soil'),
        'temperature': data.get('temperature'),
        'humidity': data.get('humidity'),
        'ph': data.get('ph'),
        'rainfall': data.get('annual_rainfall'),
        'area': area
    }

    # Step 1 — crop recommendations
    top_crops = crop_recommender.predict_top_n(base_features, n=top_n * 2)

    results = []
    for item in top_crops:
        crop = item["crop"]

        # Filter by season
        crop_season = price_predictor.get_crop_season(crop)
        user_season = data.get('season', 'Whole Year')
        
        if user_season != "Whole Year" and crop_season != "Whole Year" and crop_season != user_season:
            continue

        # Step 2 — yield prediction
        predicted_yield = yield_predictor.predict({**base_features, 'crop': crop})

        # Step 3 — price prediction
        avg_price = price_predictor.predict(state=selected_state, crop=crop)

        # Step 4 — Suitability check
        suitability = price_predictor.get_suitability(state=selected_state, crop=crop)

        # Step 4.1 — Environmental Safety Check
        env_score = price_predictor.check_environmental_suitability(
            crop, 
            data.get('annual_rainfall', 0),
            data.get('ph')
        )
        if env_score < 0.5:
            continue

        # Step 5 — revenue
        expected_revenue = predicted_yield * area * 10 * avg_price * env_score

        results.append({
            "crop": crop,
            "predicted_yield": round(predicted_yield, 3),
            "avg_price": round(avg_price, 2),
            "expected_revenue": round(expected_revenue, 2),
            "suitability": suitability,
        })
        
        if len(results) >= top_n:
            break

    # Balanced Ranking: Suitability weighting revenue
    suitability_map = {"traditional": 1.5, "common": 1.2, "rare": 0.8}
    results.sort(key=lambda x: suitability_map.get(x['suitability'], 0) * x['expected_revenue'], reverse=True)

    if not silent:
        for i, res in enumerate(results):
            print(f"{i+1}. {res['crop']:12s} | Suit: {res['suitability']:11s} | Yield: {res['predicted_yield']:6.2f} t/ha | Price: ₹{res['avg_price']:8.2f}/q | Rev: ₹{res['expected_revenue']:10.2f}")
        print("\n")
    return results

if __name__ == "__main__":
    print("=== Reproducibility Check ===")
    s = scenarios[0]
    res1 = run_test(s, silent=True)
    res2 = run_test(s, silent=True)
    
    match = True
    for c1, c2 in zip(res1, res2):
        if c1['avg_price'] != c2['avg_price']:
            print(f"❌ Price mismatch for {c1['crop']}: {c1['avg_price']} != {c2['avg_price']}")
            match = False
    
    if match:
        print("✅ Mandi prices are 100% stable for identical inputs.\n")

    for s in scenarios:
        run_test(s)
