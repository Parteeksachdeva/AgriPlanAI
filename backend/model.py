import pandas as pd
from xgboost import XGBRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import os

FEATURE_COLS = ['state', 'season', 'annual_rainfall', 'fertilizer', 'pesticide',
                'area', 'n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph', 'crop']
NUMERIC_FEATURES = ['annual_rainfall', 'fertilizer', 'pesticide', 'area',
                    'n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph']
CATEGORICAL_FEATURES = ['state', 'season', 'crop']


def _build_pipeline():
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, NUMERIC_FEATURES),
        ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES)
    ])
    return Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', XGBRegressor(random_state=42))
    ])


class CropYieldModel:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None

    def train(self):
        if not os.path.exists(self.data_path):
            print(f"Dataset not found at {self.data_path}. Training a dummy model...")
            self._train_dummy()
            return

        df = pd.read_csv(self.data_path)
        if df.empty:
            print("Dataset is empty. Training a dummy model...")
            self._train_dummy()
            return

        X = df[FEATURE_COLS]
        y = df['yield']

        self.pipeline = _build_pipeline()
        self.pipeline.fit(X, y)
        print("Model trained successfully on provided dataset.")

    def _train_dummy(self):
        df = pd.DataFrame({
            'state':           ['Assam',     'Karnataka', 'Punjab',  'Assam'],
            'season':          ['Kharif',    'Rabi',      'Whole Year', 'Summer'],
            'annual_rainfall': [2051.4,      1266.7,      649.0,     2051.4],
            'fertilizer':      [631643.29,   40143657.7,  50000.0,   1000000.0],
            'pesticide':       [2057.47,     130761.1,    163.0,     3000.0],
            'area':            [6637.0,      421810.0,    500.0,     10000.0],
            'n_soil':          [80.6,        26.1,        50.0,      None],
            'p_soil':          [47.6,        69.3,        30.0,      None],
            'k_soil':          [39.9,        22.4,        40.0,      None],
            'temperature':     [23.6,        30.5,        25.0,      None],
            'humidity':        [82.4,        52.3,        60.0,      None],
            'ph':              [6.47,        5.87,        7.0,       None],
            'crop':            ['PigeonPeas','PigeonPeas','Wheat',   'Rice'],
            'yield':           [0.71,        0.27,        1.5,       0.98],
        })
        X = df[FEATURE_COLS]
        y = df['yield']

        self.pipeline = _build_pipeline()
        self.pipeline.fit(X, y)
        print("Dummy model trained successfully.")

    def predict(self, input_data: dict) -> float:
        if self.pipeline is None:
            raise ValueError("Model is not trained yet.")
        df = pd.DataFrame([input_data])
        prediction = self.pipeline.predict(df)
        return float(prediction[0])

    def get_feature_importance(self) -> dict:
        if self.pipeline is None:
            raise ValueError("Model is not trained yet.")
        xgboost_model = self.pipeline.named_steps['regressor']
        importances = xgboost_model.feature_importances_
        preprocessor = self.pipeline.named_steps['preprocessor']
        feature_names = preprocessor.get_feature_names_out()
        importance_dict = {str(name): float(imp) for name, imp in zip(feature_names, importances)}
        return dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))
