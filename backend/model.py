import pandas as pd
import numpy as np
from xgboost import XGBRegressor, XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
import os

# Feature sets shared across models
CROP_NUMERIC = ['annual_rainfall', 'fertilizer', 'pesticide', 'area',
                'n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph']
CROP_CATEGORICAL = ['state', 'season']
CROP_FEATURES = CROP_CATEGORICAL + CROP_NUMERIC   # inputs for Model 1a

YIELD_CATEGORICAL = ['state', 'season', 'crop']
YIELD_FEATURES = CROP_FEATURES + ['crop']         # inputs for Model 1b

PRICE_FEATURES = ['State', 'Commodity']           # inputs for Model 2

# Maps model1 crop names → model2 Commodity names.
# Crops mapped to None have no matching commodity in the mandi dataset.
CROP_TO_COMMODITY = {
    'Arecanut':              'Arecanut(Betelnut/Supari)',
    'Bajra':                 'Bajra(Pearl Millet/Cumbu)',
    'Banana':                'Banana',
    'Barley':                'Barley(Jau)',
    'Black pepper':          'Black pepper',
    'Cardamom':              None,
    'Cashewnut':             'Cashewnuts',
    'Castor seed':           'Castor Seed',
    'ChickPea':              'Bengal Gram(Gram)(Whole)',
    'Coconut':               'Coconut',
    'Coriander':             'Corriander seed',
    'Cotton':                'Cotton',
    'Cowpea(Lobia)':         'Cowpea(Lobia/Karamani)',
    'Dry chillies':          'Dry Chillies',
    'Garlic':                'Garlic',
    'Ginger':                'Ginger(Green)',
    'Groundnut':             'Groundnut',
    'Guar seed':             'Guar Seed(Cluster Beans Seed)',
    'Horse-gram':            'Kulthi(Horse Gram)',
    'Jowar':                 'Jowar(Sorghum)',
    'Jute':                  None,
    'Khesari':               None,
    'Linseed':               None,
    'Maize':                 'Maize',
    'Masoor':                'Lentil(Masur)(Whole)',
    'Mesta':                 None,
    'MothBeans':             None,
    'MungBean':              'Green Gram(Moong)(Whole)',
    'Niger seed':            None,
    'Oilseeds total':        None,
    'Onion':                 'Onion',
    'Other  Rabi pulses':    None,
    'Other Cereals':         None,
    'Other Kharif pulses':   None,
    'Other Summer Pulses':   None,
    'Peas & beans (Pulses)': 'Peas Wet',
    'PigeonPeas':            'Arhar(Tur/Red Gram)(Whole)',
    'Potato':                'Potato',
    'Ragi':                  'Ragi(Finger Millet)',
    'Rapeseed &Mustard':     'Mustard',
    'Rice':                  'Rice',
    'Safflower':             None,
    'Sannhamp':              None,
    'Sesamum':               'Sesamum(Sesame,Gingelly,Til)',
    'Small millets':         None,
    'Soyabean':              'Soyabean',
    'Sugarcane':             'Gur(Jaggery)',
    'Sunflower':             'Sunflower Seed',
    'Sweet potato':          'Sweet Potato',
    'Tapioca':               'Tapioca',
    'Tobacco':               None,
    'Turmeric':              'Turmeric(raw)',
    'Urad':                  'Black Gram(Urd Beans)(Whole)',
    'Wheat':                 'Wheat',
    'other oilseeds':        None,
}


def _build_crop_classifier_pipeline():
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, CROP_NUMERIC),
        ('cat', OneHotEncoder(handle_unknown='ignore'), CROP_CATEGORICAL)
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
        df.columns = df.columns.str.lower()

        # Drop yield outliers so the classifier learns from realistic examples
        p99 = df.groupby('crop')['yield'].transform(lambda x: x.quantile(0.99))
        df = df[df['yield'] <= p99].copy()

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

        df = pd.read_csv(self.data_path)
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

        df = pd.DataFrame([input_data])
        raw = float(self.pipeline.predict(df)[0])

        # Clamp: non-negative and no higher than the 99th pct seen in training
        raw = max(0.0, raw)
        cap = self.yield_caps.get(input_data.get('crop'))
        if cap is not None:
            raw = min(raw, cap)

        return raw


class PricePredictionModel:
    """Model 2 — regression: predicts mandi Modal_Price (INR/quintal) for a crop in a state."""

    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None
        self.global_avg_price: float = 0.0   # fallback for unmapped crops

    def train(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Model 2 training data not found: {self.data_path}")

        df = pd.read_csv(self.data_path)
        df = df[['State', 'Commodity', 'Modal_Price']].dropna()

        self.global_avg_price = float(df['Modal_Price'].mean())

        X = df[PRICE_FEATURES]
        y = df['Modal_Price']

        self.pipeline = _build_price_regressor_pipeline()
        self.pipeline.fit(X, y)
        print("Model 2 trained — price regressor.")

    def predict(self, state: str, crop: str) -> float:
        """
        Accepts a model1 crop name, maps it to the matching mandi Commodity name,
        then predicts Modal_Price (INR/quintal).  Returns the global average price
        for crops with no commodity mapping.
        """
        if self.pipeline is None:
            raise ValueError("Model 2 is not trained.")

        commodity = CROP_TO_COMMODITY.get(crop)
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

    print("\n=== Smoke test (Punjab, Kharif) ===")
    base = {
        'state': 'Haryana', 'season': 'Summer',
        'annual_rainfall': 100.0, 'fertilizer': 50000.0, 'pesticide': 163.0,
        'area': 5.0, 'n_soil': 80.0, 'p_soil': 47.0, 'k_soil': 20.0,
        'temperature': 44.0, 'humidity': 5.0, 'ph': 6.0
    }
    tops = recommender.predict_top_n(base, n=5)
    for item in tops:
        crop = item['crop']
        y = yield_model.predict({**base, 'crop': crop})
        p = price_model.predict('Haryana', crop)
        rev = y * base['area'] * 10 * p
        print(f"{crop:25s}  yield={y:.3f} t/ha  price=₹{p:.0f}/q  revenue=₹{rev:,.0f}")
