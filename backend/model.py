import pandas as pd
import numpy as np
from xgboost import XGBRegressor, XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
import os
import json
from thefuzz import process

# Feature sets shared across models
# Kaggle features: N, P, K, temperature, humidity, ph, rainfall
CROP_NUMERIC = ['n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph', 'rainfall']
CROP_CATEGORICAL = []                             # Kaggle dataset has no categorical features besides label
CROP_FEATURES = CROP_CATEGORICAL + CROP_NUMERIC   # inputs for Model 1a

YIELD_CATEGORICAL = ['crop']                      # simplified yield features
YIELD_FEATURES = CROP_FEATURES + ['crop']         # inputs for Model 1b

PRICE_FEATURES = ['State', 'Commodity']           # inputs for Model 2

# Maps Kaggle crop labels → model2 Commodity names.
# DEPRECATED: Moving to dynamic fuzzy matching in PricePredictionModel
CROP_TO_COMMODITY = {}


def _build_crop_classifier_pipeline():
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    # Since CROP_CATEGORICAL is empty, we handle it gracefully
    if CROP_CATEGORICAL:
        preprocessor = ColumnTransformer([
            ('num', numeric_transformer, CROP_NUMERIC),
            ('cat', OneHotEncoder(handle_unknown='ignore'), CROP_CATEGORICAL)
        ])
    else:
        preprocessor = ColumnTransformer([
            ('num', numeric_transformer, CROP_NUMERIC)
        ])

    return Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', XGBClassifier(random_state=42))
    ])


def _build_yield_regressor_pipeline():
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, CROP_NUMERIC),
        ('cat', OneHotEncoder(handle_unknown='ignore'), YIELD_CATEGORICAL)
    ])
    return Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', XGBRegressor(random_state=42))
    ])


def _build_price_regressor_pipeline():
    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore'), PRICE_FEATURES)
    ])
    return Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', XGBRegressor(random_state=42))
    ])


class CropRecommendationModel:
    """Model 1a — multi-class classifier: recommends top-N crops given field conditions."""

    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None
        self.label_encoder = LabelEncoder()
        self.classes_ = None

    def train(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Model 1a training data not found: {self.data_path}")

        df = pd.read_csv(self.data_path)
        # Kaggle dataset has: N,P,K,temperature,humidity,ph,rainfall,label
        # Map to internal names or use direct Kaggle names
        rename_map = {
            'N': 'n_soil', 'P': 'p_soil', 'K': 'k_soil', 'label': 'crop', 'rainfall': 'rainfall'
        }
        df = df.rename(columns=rename_map)

        X = df[CROP_FEATURES]
        y = self.label_encoder.fit_transform(df['crop'])
        self.classes_ = self.label_encoder.classes_

        self.pipeline = _build_crop_classifier_pipeline()
        self.pipeline.fit(X, y)
        print(f"Model 1a trained — {len(self.classes_)} crop classes.")

    def predict_top_n(self, input_data: dict, n: int = 5) -> list:
        """Returns top-N crops sorted by predicted probability."""
        if self.pipeline is None:
            raise ValueError("Model 1a is not trained.")

        df = pd.DataFrame([input_data])
        proba = self.pipeline.predict_proba(df)[0]
        top_indices = np.argsort(proba)[::-1][:n]

        return [
            {"crop": self.classes_[i], "probability": float(proba[i])}
            for i in top_indices
        ]


class YieldPredictionModel:
    """Model 1b — regression: predicts yield (t/ha) for a given crop + field conditions."""

    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None
        self.yield_caps: dict = {}   # per-crop 99th pct cap used to bound predictions

    def train(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Model 1b training data not found: {self.data_path}")

    def train(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Model 1b training data not found: {self.data_path}")

        df = pd.read_csv(self.data_path)
        if 'yield' not in df.columns:
            print("Warning: 'yield' column missing in Model 1b data. Using default yield values.")
            self.pipeline = "DUMMY"
            return

        df.columns = df.columns.str.lower()
        # Store per-crop 99th percentile caps before filtering
        self.yield_caps = df.groupby('crop')['yield'].quantile(0.99).to_dict()

        # Remove outliers above 99th percentile per crop
        p99 = df.groupby('crop')['yield'].transform(lambda x: x.quantile(0.99))
        df = df[df['yield'] <= p99].copy()

        X = df[YIELD_FEATURES]
        y = df['yield']

        self.pipeline = _build_yield_regressor_pipeline()
        self.pipeline.fit(X, y)
        print("Model 1b trained — yield regressor.")

    def predict(self, input_data: dict) -> float:
        if self.pipeline is None:
            raise ValueError("Model 1b is not trained.")

        if self.pipeline == "DUMMY":
            # Return plausible default yields (t/ha) for Kaggle crops
            defaults = {
                'rice': 3.5, 'maize': 2.5, 'chickpea': 1.2, 'kidneybeans': 1.1,
                'pigeonpeas': 1.0, 'mothbeans': 0.8, 'mungbean': 0.9, 'blackgram': 0.9,
                'lentil': 1.0, 'pomegranate': 10.0, 'banana': 35.0, 'mango': 8.5,
                'grapes': 20.0, 'watermelon': 25.0, 'muskmelon': 2.0, 'apple': 12.0,
                'orange': 15.0, 'papaya': 40.0, 'coconut': 10.0, 'cotton': 2.0,
                'jute': 2.2, 'coffee': 0.8, 'wheat': 5.0
            }
            return defaults.get(input_data.get('crop'), 2.0)

        df = pd.DataFrame([input_data])
        raw = float(self.pipeline.predict(df)[0])

        # Clamp: non-negative and no higher than the 99th pct seen in training
        raw = max(0.0, raw)
        cap = self.yield_caps.get(input_data.get('crop'))
        if cap is not None:
            raw = min(raw, cap)

        return raw


# Manual suitability bias is now handled via crop_metadata.json and RAG fallback


class PricePredictionModel:
    """Model 2 — regression: predicts mandi Modal_Price (INR/quintal) for a crop in a state."""

    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None
        self.global_avg_price: float = 0.0   # fallback for unmapped crops
        self.suitability_set: set = set()    # {(State, Commodity), ...}
        self.commodities: list = []          # unique available commodities
        self.crop_metadata: dict = {}        # loaded from crop_metadata.json
        self._load_metadata()

    def _load_metadata(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        meta_path = os.path.join(base_dir, "data", "crop_metadata.json")
        try:
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    self.crop_metadata = json.load(f)
        except Exception as e:
            print(f"Error loading crop metadata: {e}")

    def get_crop_season(self, crop: str) -> str:
        """Scalable season lookup with RAG fallback."""
        crop_lower = crop.lower()
        if crop_lower in self.crop_metadata:
            metadata = self.crop_metadata[crop_lower]
            return metadata.get("season") if isinstance(metadata, dict) else metadata
        
        return "Whole Year"

    def train(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Model 2 training data not found: {self.data_path}")

        df = pd.read_csv(self.data_path)
        df = df[['State', 'Commodity', 'Modal_Price']].dropna()

        # Build suitability map from historical trading data
        pairs = zip(df['State'], df['Commodity'])
        self.suitability_set = set(pairs)

        self.global_avg_price = float(df['Modal_Price'].mean())

        X = df[PRICE_FEATURES]
        y = df['Modal_Price']

        self.commodities = sorted(df['Commodity'].unique().tolist())
        
        self.pipeline = _build_price_regressor_pipeline()
        self.pipeline.fit(X, y)
        print(f"Model 2 trained — price regressor ({len(self.suitability_set)} state-crop pairs).")

    def get_commodity_mapping(self, crop: str) -> str:
        """Scalable fuzzy matching to link model crops to mandi commodities."""
        if not self.commodities:
            return None
        # Use fuzzy matching to find the best commodity name
        # score_cutoff helps avoid wildly incorrect matches
        match, score = process.extractOne(crop, self.commodities, score_cutoff=60) or (None, 0)
        return match

    def get_suitability(self, state: str, crop: str) -> str:
        """Determines the suitability tier for a crop in the given state."""
        crop_lower = crop.lower()
        
        # 1. Check rich metadata first
        if crop_lower in self.crop_metadata:
            meta = self.crop_metadata[crop_lower]
            if isinstance(meta, dict) and state in meta.get("traditional_states", []):
                return "traditional"

        # 2. Fallback to historical Mandi trading records
        commodity = self.get_commodity_mapping(crop)
        if not commodity:
            return "rare"

        if (state, commodity) in self.suitability_set:
            return "common"

        return "rare"

    def check_environmental_suitability(self, crop: str, rainfall: float) -> float:
        """
        Returns a penalty score (0.0 to 1.0) based on environmental factors.
        1.0 means perfectly suitable, < 1.0 means penalty.
        Currently focuses on rainfall requirements.
        """
        crop_lower = crop.lower()
        if crop_lower not in self.crop_metadata:
            return 1.0
            
        meta = self.crop_metadata[crop_lower]
        if not isinstance(meta, dict):
            return 1.0
            
        min_rf = meta.get("min_rainfall", 0)
        if rainfall < min_rf:
            # Steep penalty if rainfall is way below requirement
            # e.g., if rice (1000mm) is grown in 300mm: 300/1000 = 0.3
            ratio = rainfall / min_rf
            if ratio < 0.5:
                return 0.1 # Severe penalty
            return ratio
            
        return 1.0

    def predict(self, state: str, crop: str) -> float:
        """
        Accepts a model1 crop name, maps it to the matching mandi Commodity name,
        then predicts Modal_Price (INR/quintal).
        """
        if self.pipeline is None:
            raise ValueError("Model 2 is not trained.")

        commodity = self.get_commodity_mapping(crop)
        if commodity is None:
            return self.global_avg_price

        df = pd.DataFrame([{'State': state, 'Commodity': commodity}])
        return float(self.pipeline.predict(df)[0])


if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    m1_path = os.path.join(BASE_DIR, "data", "model1_training.csv")
    m2_path = os.path.join(BASE_DIR, "data", "model2_training.csv")

    recommender = CropRecommendationModel(m1_path)
    recommender.train()

    yield_model = YieldPredictionModel(m1_path)
    yield_model.train()

    price_model = PricePredictionModel(m2_path)
    price_model.train()

    print("\n=== Smoke test (Kaggle dataset style) ===")
    base = {
        'n_soil': 90.0, 'p_soil': 42.0, 'k_soil': 43.0,
        'temperature': 20.87, 'humidity': 82.0, 'ph': 6.5, 'rainfall': 202.9,
        'area': 2.0  # hypothetical field size
    }
    tops = recommender.predict_top_n(base, n=5)
    for item in tops:
        crop = item['crop']
        y = yield_model.predict({**base, 'crop': crop})
        p = price_model.predict('Punjab', crop)
        # revenue formula: yield(t/ha) * area(ha) * price(INR/q) * 10(q/t)
        rev = y * base['area'] * 10 * p
        print(f"{crop:15s}  prob={item['probability']:.2f}  yield={y:.1f}t/ha  price=₹{p:.0f}/q  income=₹{rev:,.0f}")
