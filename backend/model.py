import pandas as pd
from xgboost import XGBRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import os

class CropYieldModel:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.pipeline = None

    def train(self):
        if not os.path.exists(self.data_path):
            print(f"Dataset not found at {self.data_path}. Creating and training a dummy model...")
            self._train_dummy()
            return
            
        df = pd.read_csv(self.data_path)
        if df.empty:
            print("Dataset is empty. Creating and training a dummy model...")
            self._train_dummy()
            return

        # Expected features and target
        X = df[['rainfall', 'temperature', 'soil_type', 'irrigation', 'season', 'crop']]
        y = df['yield']

        numeric_features = ['rainfall', 'temperature', 'irrigation']
        categorical_features = ['soil_type', 'season', 'crop']

        # Preprocessing pipeline
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ]
        )

        # Full pipeline with XGBoost
        self.pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', XGBRegressor(random_state=42))
        ])

        # Train model
        self.pipeline.fit(X, y)
        print("Model trained successfully on provided dataset.")

    def _train_dummy(self):
        # Create a small dummy dataframe to initialize the pipeline structure
        df = pd.DataFrame({
            'rainfall': [100.0, 200.0, 150.0, 50.5],
            'temperature': [25.0, 30.0, 22.0, 28.0],
            'soil_type': ['loamy', 'clay', 'sandy', 'loamy'],
            'irrigation': [1, 0, 1, 0],
            'season': ['kharif', 'rabi', 'zaid', 'kharif'],
            'crop': ['wheat', 'rice', 'maize', 'millet'],
            'yield': [2.5, 3.0, 4.0, 1.8]
        })
        X = df[['rainfall', 'temperature', 'soil_type', 'irrigation', 'season', 'crop']]
        y = df['yield']
        
        numeric_features = ['rainfall', 'temperature', 'irrigation']
        categorical_features = ['soil_type', 'season', 'crop']

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ]
        )

        self.pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', XGBRegressor(random_state=42))
        ])

        self.pipeline.fit(X, y)
        print("Dummy model trained successfully.")

    def predict(self, input_data: dict) -> float:
        if self.pipeline is None:
            raise ValueError("Model is not trained yet.")
        
        # Convert input dictionary to DataFrame
        df = pd.DataFrame([input_data])
        prediction = self.pipeline.predict(df)
        return float(prediction[0])

    def get_feature_importance(self) -> dict:
        if self.pipeline is None:
            raise ValueError("Model is not trained yet.")
        
        # Get the XGBoost model
        xgboost_model = self.pipeline.named_steps['regressor']
        importances = xgboost_model.feature_importances_
        
        # Get the feature names from the preprocessor
        preprocessor = self.pipeline.named_steps['preprocessor']
        feature_names = preprocessor.get_feature_names_out()
        
        # Map importances to feature names
        importance_dict = {str(name): float(imp) for name, imp in zip(feature_names, importances)}
        
        # Sort in descending order of importance
        importance_dict = dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))
        
        return importance_dict
