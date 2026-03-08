"""
Enhanced ML Models for AgriPlanAI with State-Specific Data Integration

This module provides improved prediction models that incorporate:
1. Real state-specific yield data from DES (Directorate of Economics & Statistics)
2. Enhanced price prediction with state-wise market variations
3. Weather-aware yield adjustments
4. Confidence scoring for predictions
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor, XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os
import json
from typing import Dict, List, Tuple, Optional
from datetime import datetime

# Enhanced feature sets with state information
CROP_NUMERIC = ['n_soil', 'p_soil', 'k_soil', 'temperature', 'humidity', 'ph', 'rainfall']
CROP_CATEGORICAL = ['state']  # Now including state as categorical feature
CROP_FEATURES = CROP_NUMERIC + CROP_CATEGORICAL

YIELD_FEATURES = CROP_FEATURES + ['crop']

PRICE_CAT_FEATURES = ['State', 'Commodity']
PRICE_NUM_FEATURES = ['month', 'rainfall_deviation', 'season_factor']


class StateAwareYieldModel:
    """
    Enhanced yield prediction model with state-specific calibration.
    
    Features:
    - Base XGBoost model trained on enhanced dataset
    - State-specific yield lookup from real government data
    - NPK factor adjustment based on soil nutrients
    - Climate factor adjustment based on weather
    - Confidence scoring based on data availability
    """
    
    def __init__(self, data_path: str = None):
        self.data_path = data_path
        self.pipeline = None
        self.label_encoder = LabelEncoder()
        self.state_yield_lookup: Dict[Tuple[str, str], float] = {}
        self.crop_national_avg: Dict[str, float] = {}
        self.state_productivity_index: Dict[str, float] = {}
        self.yield_caps: Dict[str, float] = {}
        self.is_trained = False
        
    def _load_state_yield_data(self):
        """Load state-specific yield data from enhanced dataset."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Try enhanced data first
        enhanced_path = os.path.join(base_dir, "data", "state_yield_data_enhanced.csv")
        if os.path.exists(enhanced_path):
            df = pd.read_csv(enhanced_path)
            self.state_yield_lookup = {
                (row['state'], row['crop']): row['yield_t_ha']
                for _, row in df.iterrows()
            }
            self.crop_national_avg = df.groupby('crop')['yield_t_ha'].mean().to_dict()
            print(f"Loaded enhanced yield data: {len(self.state_yield_lookup)} state-crop combinations")
            return
        
        # Fallback to original state_crop_yields.csv
        fallback_path = os.path.join(base_dir, "data", "state_crop_yields.csv")
        if os.path.exists(fallback_path):
            df = pd.read_csv(fallback_path)
            self.state_yield_lookup = {
                (row['state'], row['crop']): row['avg_yield_t_ha']
                for _, row in df.iterrows()
            }
            self.crop_national_avg = df.groupby('crop')['avg_yield_t_ha'].mean().to_dict()
            print(f"Loaded fallback yield data: {len(self.state_yield_lookup)} state-crop combinations")
    
    def _build_pipeline(self):
        """Build XGBoost pipeline with state encoding."""
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer([
            ('num', numeric_transformer, CROP_NUMERIC),
            ('cat', categorical_transformer, ['state', 'crop'])
        ])
        
        return Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', XGBRegressor(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            ))
        ])
    
    def train(self, data_path: str = None):
        """Train the model on enhanced dataset."""
        if data_path:
            self.data_path = data_path
            
        if not self.data_path or not os.path.exists(self.data_path):
            print("Warning: No training data found. Using lookup-based predictions only.")
            self._load_state_yield_data()
            return
        
        # Load training data
        df = pd.read_csv(self.data_path)
        print(f"Training on {len(df)} records from {self.data_path}")
        
        # Calculate yield caps per crop (99th percentile)
        self.yield_caps = df.groupby('crop')['yield_t_ha'].quantile(0.99).to_dict()
        
        # Remove outliers
        p99 = df.groupby('crop')['yield_t_ha'].transform(lambda x: x.quantile(0.99))
        df = df[df['yield_t_ha'] <= p99].copy()
        
        # Prepare features
        X = df[CROP_NUMERIC + ['state', 'crop']]
        y = df['yield_t_ha']
        
        # Split for validation
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Build and train pipeline
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.pipeline.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        r2 = r2_score(y_val, y_pred)
        
        print(f"Model trained - MAE: {mae:.3f} t/ha, R²: {r2:.3f}")
        
        # Load state lookup for hybrid predictions
        self._load_state_yield_data()
        self.is_trained = True
    
    def _calculate_npk_factor(self, n: float, p: float, k: float, crop: str) -> float:
        """Calculate yield multiplier based on soil NPK levels."""
        # Crop-specific optimal NPK values
        optimal_npk = {
            'rice': (100, 50, 50), 'wheat': (120, 60, 40), 'maize': (150, 75, 60),
            'cotton': (120, 60, 60), 'sugarcane': (150, 60, 90),
            'chickpea': (20, 50, 30), 'lentil': (20, 40, 20),
            'default': (80, 50, 40)
        }
        
        opt_n, opt_p, opt_k = optimal_npk.get(crop, optimal_npk['default'])
        
        # Calculate individual factors
        n_factor = min(1.3, 0.5 + 0.5 * (n / opt_n)) if n < opt_n else min(1.2, 1.0 + 0.2 * (n - opt_n) / opt_n)
        p_factor = min(1.2, 0.6 + 0.4 * (p / opt_p)) if p < opt_p else min(1.1, 1.0 + 0.1 * (p - opt_p) / opt_p)
        k_factor = min(1.2, 0.6 + 0.4 * (k / opt_k)) if k < opt_k else min(1.1, 1.0 + 0.1 * (k - opt_k) / opt_k)
        
        # Weighted combination
        combined = (n_factor ** 0.5) * (p_factor ** 0.25) * (k_factor ** 0.25)
        return max(0.4, min(1.3, combined))
    
    def _calculate_climate_factor(self, temperature: float, humidity: float, 
                                   rainfall: float, crop: str, state: str) -> float:
        """Calculate yield multiplier based on climate conditions."""
        # Crop-specific optimal ranges
        crop_climate = {
            'rice': ((20, 35), (60, 90), (1000, 2500)),
            'wheat': ((15, 25), (50, 70), (400, 800)),
            'maize': ((20, 30), (55, 75), (500, 800)),
            'cotton': ((25, 35), (60, 80), (600, 1200)),
            'default': ((20, 30), (50, 80), (500, 1500))
        }
        
        (temp_min, temp_max), (hum_min, hum_max), (rain_min, rain_max) = \
            crop_climate.get(crop, crop_climate['default'])
        
        # Temperature factor
        if temp_min <= temperature <= temp_max:
            temp_factor = 1.0
        elif temperature < temp_min:
            temp_factor = max(0.6, 1.0 - (temp_min - temperature) / 10)
        else:
            temp_factor = max(0.7, 1.0 - (temperature - temp_max) / 15)
        
        # Humidity factor
        if hum_min <= humidity <= hum_max:
            hum_factor = 1.0
        elif humidity < hum_min:
            hum_factor = max(0.8, 1.0 - (hum_min - humidity) / 50)
        else:
            hum_factor = max(0.85, 1.0 - (humidity - hum_max) / 50)
        
        # Rainfall factor
        if rain_min <= rainfall <= rain_max:
            rain_factor = 1.0
        elif rainfall < rain_min:
            rain_factor = max(0.5, 1.0 - (rain_min - rainfall) / rain_min)
        else:
            rain_factor = max(0.6, 1.0 - (rainfall - rain_max) / rain_max)
        
        return temp_factor * hum_factor * rain_factor
    
    def predict(self, input_data: dict, return_confidence: bool = False) -> dict:
        """
        Predict yield with state-specific calibration.
        
        Returns:
            dict with 'yield_t_ha', 'confidence', 'data_source', 'factors'
        """
        state = input_data.get('state', 'Unknown')
        crop = input_data.get('crop', 'rice').lower()
        n = input_data.get('n_soil', 80) or 80
        p = input_data.get('p_soil', 50) or 50
        k = input_data.get('k_soil', 40) or 40
        temperature = input_data.get('temperature', 25) or 25
        humidity = input_data.get('humidity', 70) or 70
        rainfall = input_data.get('rainfall', 800) or 800
        
        # Get base yield from state-specific lookup
        base_yield = None
        data_source = "unknown"
        confidence = "low"
        
        if (state, crop) in self.state_yield_lookup:
            base_yield = self.state_yield_lookup[(state, crop)]
            data_source = "state_specific"
            confidence = "high"
        elif crop in self.crop_national_avg:
            base_yield = self.crop_national_avg[crop]
            data_source = "national_average"
            confidence = "medium"
        else:
            # Use ML model prediction if available
            if self.is_trained and self.pipeline:
                try:
                    X = pd.DataFrame([{
                        'n_soil': n, 'p_soil': p, 'k_soil': k,
                        'temperature': temperature, 'humidity': humidity,
                        'ph': input_data.get('ph', 6.5),
                        'rainfall': rainfall,
                        'state': state, 'crop': crop
                    }])
                    base_yield = float(self.pipeline.predict(X)[0])
                    data_source = "ml_prediction"
                    confidence = "medium"
                except Exception as e:
                    print(f"ML prediction failed: {e}")
                    base_yield = 2.0
                    data_source = "fallback"
            else:
                base_yield = 2.0
                data_source = "fallback"
        
        # Apply adjustment factors
        npk_factor = self._calculate_npk_factor(n, p, k, crop)
        climate_factor = self._calculate_climate_factor(temperature, humidity, rainfall, crop, state)
        
        # Combined adjustment (weighted)
        adjustment = (npk_factor ** 0.6) * (climate_factor ** 0.4)
        
        final_yield = base_yield * adjustment
        
        # Apply crop-specific cap
        if crop in self.yield_caps:
            final_yield = min(final_yield, self.yield_caps[crop] * 1.1)
        
        result = {
            'yield_t_ha': round(max(0.1, final_yield), 2),
            'confidence': confidence,
            'data_source': data_source,
            'factors': {
                'npk_factor': round(npk_factor, 3),
                'climate_factor': round(climate_factor, 3),
                'base_yield': round(base_yield, 2),
                'adjustment': round(adjustment, 3)
            }
        }
        
        if return_confidence:
            return result
        return result['yield_t_ha']


class EnhancedPricePredictionModel:
    """
    Enhanced price prediction with state-wise market variations and external factors.
    """
    
    def __init__(self, data_path: str = None):
        self.data_path = data_path
        self.pipeline = None
        self.state_price_lookup: Dict[Tuple[str, str], float] = {}
        self.commodity_avg: Dict[str, float] = {}
        self.is_trained = False
        
    def _load_price_data(self):
        """Load enhanced price data and recent real data."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        enhanced_path = os.path.join(base_dir, "data", "mandi_prices_enhanced.csv")
        if os.path.exists(enhanced_path):
            df = pd.read_csv(enhanced_path)
            # Use most recent prices for lookup
            latest_prices = df.sort_values('date').groupby(['state', 'commodity']).last().reset_index()
            self.state_price_lookup = {
                (row['state'], row['commodity']): row['modal_price']
                for _, row in latest_prices.iterrows()
            }
            self.commodity_avg = latest_prices.groupby('commodity')['modal_price'].mean().to_dict()
            print(f"Loaded enhanced price lookups: {len(self.state_price_lookup)} combinations")

    def _build_pipeline(self):
        """Build XGBoost pipeline for price prediction."""
        categorical_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer([
            ('cat', categorical_transformer, ['State', 'Commodity']),
            ('num', StandardScaler(), ['month', 'day'])
        ])
        
        return Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', XGBRegressor(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1
            ))
        ])

    def train(self, data_path: str = None):
        """Train price prediction model."""
        if data_path:
            self.data_path = data_path
            
        if not self.data_path or not os.path.exists(self.data_path):
            print("Warning: No large price training data found. Using lookup mode.")
            self._load_price_data()
            return

        print(f"Training price model on {self.data_path}")
        df = pd.read_csv(self.data_path)
        
        # Preprocess dates
        df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], dayfirst=True)
        df['month'] = df['Arrival_Date'].dt.month
        df['day'] = df['Arrival_Date'].dt.day
        
        # Features and target
        X = df[['State', 'Commodity', 'month', 'day']]
        y = df['Modal_Price']
        
        # Split and train
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.pipeline.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        print(f"Price model trained - MAE: ₹{mae:.2f}")
        
        self._load_price_data()
        self.is_trained = True
    
    def predict_price(self, commodity: str, state: str, 
                      days_ahead: int = 7,
                      include_factors: bool = False) -> dict:
        """
        Predict mandi price with hybrid ML and lookup approach.
        """
        commodity_clean = commodity.lower()
        
        # ML Prediction if trained
        ml_price = None
        if self.is_trained and self.pipeline:
            future_date = datetime.now() + pd.Timedelta(days=days_ahead)
            X_pred = pd.DataFrame([{
                'State': state,
                'Commodity': commodity.capitalize(),
                'month': future_date.month,
                'day': future_date.day
            }])
            try:
                ml_price = float(self.pipeline.predict(X_pred)[0])
            except:
                pass

        # Current Price lookup
        current_price = None
        if (state, commodity_clean) in self.state_price_lookup:
            current_price = self.state_price_lookup[(state, commodity_clean)]
            data_source = "hybrid_ml_real"
            confidence = "high"
        elif commodity_clean in self.commodity_avg:
            current_price = self.commodity_avg[commodity_clean]
            data_source = "ml_national"
            confidence = "medium"
        else:
            default_prices = {
                'rice': 2200, 'wheat': 2275, 'maize': 2100, 'cotton': 6500,
                'sugarcane': 350, 'potato': 1800, 'onion': 2500, 'tomato': 2500
            }
            current_price = default_prices.get(commodity_clean, 2000)
            data_source = "fallback"
            confidence = "low"

        # Predicted Price
        if ml_price:
            # Use ML price but bound it by current price +/- 20% to avoid extreme drift
            predicted_price = max(current_price * 0.8, min(current_price * 1.2, ml_price))
        else:
            # Fallback to seasonal lookup logic
            month = (datetime.now().month + (days_ahead // 30)) % 12 or 12
            seasonal_adjustment = self._get_seasonal_factor(commodity_clean, month)
            trend_factor = 1.0 + (0.001 * days_ahead)
            predicted_price = current_price * seasonal_adjustment * trend_factor
        
        # Calculate confidence interval
        volatility = 0.10 if confidence == "high" else 0.20 if confidence == "medium" else 0.30
        margin = predicted_price * volatility
        
        # Generate recommendation
        rec = self._generate_recommendation(
            current_price, predicted_price, volatility, days_ahead
        )
        
        result = {
            'commodity': commodity_clean,
            'state': state,
            'current_price': round(current_price, 2),
            'predicted_price': round(predicted_price, 2),
            'price_change_pct': round(((predicted_price - current_price) / current_price) * 100, 1),
            'confidence': confidence,
            'data_source': data_source,
            'confidence_interval': {
                'lower': round(max(0, predicted_price - margin), 2),
                'upper': round(predicted_price + margin, 2)
            },
            'prediction_date': (datetime.now() + pd.Timedelta(days=days_ahead)).strftime('%Y-%m-%d'),
            'days_ahead': days_ahead,
            'recommendation': rec['action'],
            'recommendation_reason': rec['reason'],
            'confidence_score': confidence.upper(),
            'price_trend': 'UP' if predicted_price > current_price * 1.02 else 'DOWN' if predicted_price < current_price * 0.98 else 'STABLE',
            'volatility_level': 'HIGH' if volatility > 0.25 else 'MEDIUM' if volatility > 0.15 else 'LOW'
        }

        if include_factors:
            result['factors'] = {
                'ml_predicted': round(ml_price, 2) if ml_price else None,
                'lookup_base': round(current_price, 2),
                'seasonal_adjustment': round(float(seasonal_adjustment), 3) if not ml_price else None
            }
        
        return result

    def _generate_recommendation(self, current: float, predicted: float, 
                                volatility: float, days_ahead: int) -> dict:
        """Generate sell/hold recommendation based on storage economics."""
        price_change_pct = ((predicted - current) / current) * 100 if current > 0 else 0
        
        # Storage cost calculation
        storage_cost_per_day = 0.15
        total_storage_cost = storage_cost_per_day * days_ahead
        net_gain = (predicted - current) - total_storage_cost
        
        if price_change_pct > 5 and net_gain > 0:
            return {
                'action': 'STORE_AND_SELL_LATER',
                'reason': f"Prices expected to rise by {price_change_pct:.1f}%. Predicted gain outweights storage costs."
            }
        elif price_change_pct > 2:
            return {
                'action': 'HOLD',
                'reason': "Moderate price increase expected. Hold if you have low-cost storage."
            }
        elif price_change_pct < -3:
            return {
                'action': 'SELL_NOW',
                'reason': f"Prices expected to drop by {abs(price_change_pct):.1f}%. Sell now to avoid loss."
            }
        else:
            return {
                'action': 'NEUTRAL',
                'reason': "Prices are expected to remain stable. Sell based on your immediate cash needs."
            }
    
    def _get_seasonal_factor(self, commodity: str, month: int) -> float:
        """Get seasonal price adjustment factor."""
        # Simplified seasonal patterns
        kharif_crops = ['rice', 'cotton', 'sugarcane', 'soybean', 'maize']
        rabi_crops = ['wheat', 'chickpea', 'mustard', 'barley', 'lentil']
        
        # Kharif harvest: Oct-Nov (prices drop), Lean: Apr-Jun (prices rise)
        if commodity in kharif_crops:
            if month in [10, 11]:  # Harvest
                return 0.92
            elif month in [4, 5, 6]:  # Lean
                return 1.12
        
        # Rabi harvest: Apr-May (prices drop), Lean: Oct-Dec (prices rise)
        if commodity in rabi_crops:
            if month in [4, 5]:  # Harvest
                return 0.90
            elif month in [10, 11, 12]:  # Lean
                return 1.10
        
        return 1.0


# Factory functions for easy integration
def get_state_aware_yield_model() -> StateAwareYieldModel:
    """Get or create state-aware yield model instance."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    enhanced_path = os.path.join(base_dir, "data", "model1_training_enhanced.csv")
    
    model = StateAwareYieldModel(enhanced_path)
    if os.path.exists(enhanced_path):
        model.train()
    else:
        model._load_state_yield_data()
    
    return model


def get_enhanced_price_model() -> EnhancedPricePredictionModel:
    """Get or create enhanced price model instance."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    training_path = os.path.join(base_dir, "data", "model2_training.csv")
    
    model = EnhancedPricePredictionModel(training_path)
    if os.path.exists(training_path):
        model.train()
    else:
        model._load_price_data()
    return model


if __name__ == "__main__":
    # Test the enhanced models
    print("="*60)
    print("Testing Enhanced Models")
    print("="*60)
    
    # Test yield model
    print("\n1. State-Aware Yield Model:")
    yield_model = get_state_aware_yield_model()
    
    test_cases = [
        {'state': 'Punjab', 'crop': 'wheat', 'n_soil': 100, 'p_soil': 50, 'k_soil': 40,
         'temperature': 22, 'humidity': 65, 'rainfall': 650, 'ph': 7.0},
        {'state': 'Maharashtra', 'crop': 'cotton', 'n_soil': 80, 'p_soil': 40, 'k_soil': 35,
         'temperature': 30, 'humidity': 70, 'rainfall': 900, 'ph': 6.5},
        {'state': 'Kerala', 'crop': 'rice', 'n_soil': 60, 'p_soil': 35, 'k_soil': 30,
         'temperature': 28, 'humidity': 85, 'rainfall': 2800, 'ph': 5.5},
    ]
    
    for test in test_cases:
        result = yield_model.predict(test, return_confidence=True)
        print(f"\n  {test['state']} - {test['crop']}:")
        print(f"    Predicted: {result['yield_t_ha']} t/ha")
        print(f"    Confidence: {result['confidence']}")
        print(f"    Source: {result['data_source']}")
        print(f"    Factors: NPK={result['factors']['npk_factor']:.3f}, "
              f"Climate={result['factors']['climate_factor']:.3f}")
    
    # Test price model
    print("\n\n2. Enhanced Price Model:")
    price_model = get_enhanced_price_model()
    
    price_tests = [
        ('wheat', 'Punjab'),
        ('cotton', 'Maharashtra'),
        ('rice', 'West Bengal'),
    ]
    
    for commodity, state in price_tests:
        result = price_model.predict_price(commodity, state, include_factors=True)
        print(f"\n  {commodity} in {state}:")
        print(f"    Predicted: ₹{result['predicted_price']}/quintal")
        print(f"    Confidence: {result['confidence']}")
        print(f"    Range: ₹{result['confidence_interval']['lower']} - "
              f"₹{result['confidence_interval']['upper']}")
    
    print("\n" + "="*60)
