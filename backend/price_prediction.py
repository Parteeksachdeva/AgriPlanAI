"""
Mandi Price Prediction Module
Uses historical price data to predict future prices and provide sell recommendations.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json
import os

class MandiPricePredictor:
    """
    Predicts future mandi prices based on:
    - Historical price trends
    - Seasonal patterns
    - Volatility analysis
    - Market cycles
    """
    
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.price_data: Optional[pd.DataFrame] = None
        self.commodity_stats: Dict = {}
        self.seasonal_patterns: Dict = {}
        
    def load_data(self):
        """Load and preprocess price data."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Price data not found: {self.data_path}")
            
        df = pd.read_csv(self.data_path)
        
        # Convert date column
        df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], format='%d/%m/%Y')
        
        # Sort by date
        df = df.sort_values('Arrival_Date')
        
        self.price_data = df
        
        # Calculate statistics for each commodity-state pair
        self._calculate_commodity_stats()
        
    def _calculate_commodity_stats(self):
        """Calculate price statistics for each commodity."""
        if self.price_data is None:
            return
            
        for commodity in self.price_data['Commodity'].unique():
            commodity_data = self.price_data[self.price_data['Commodity'] == commodity]
            
            self.commodity_stats[commodity] = {
                'mean_price': float(commodity_data['Modal_Price'].mean()),
                'median_price': float(commodity_data['Modal_Price'].median()),
                'std_price': float(commodity_data['Modal_Price'].std()),
                'min_price': float(commodity_data['Modal_Price'].min()),
                'max_price': float(commodity_data['Modal_Price'].max()),
                'volatility': float(commodity_data['Modal_Price'].std() / commodity_data['Modal_Price'].mean()),
                'trend': self._calculate_trend(commodity_data),
                'states': commodity_data['State'].unique().tolist(),
                'data_points': len(commodity_data)
            }
    
    def _calculate_trend(self, data: pd.DataFrame) -> float:
        """Calculate price trend (-1 to 1 scale)."""
        if len(data) < 2:
            return 0.0
            
        # Simple linear trend
        x = np.arange(len(data))
        y = data['Modal_Price'].values
        
        # Normalize to -1 to 1 scale
        slope = np.polyfit(x, y, 1)[0]
        price_range = y.max() - y.min()
        
        if price_range == 0:
            return 0.0
            
        normalized_trend = slope / (price_range / len(data))
        return float(np.clip(normalized_trend, -1, 1))
    
    def predict_price(self, commodity: str, state: str, 
                     days_ahead: int = 7) -> Dict:
        """
        Predict price for a commodity in a state.
        
        Returns:
            Dict with predicted price, confidence interval, and recommendation
        """
        # Get commodity stats
        stats = self.commodity_stats.get(commodity, {})
        
        if not stats:
            return {
                'current_price': None,
                'predicted_price': None,
                'confidence_interval': None,
                'recommendation': 'INSUFFICIENT_DATA',
                'reason': 'No historical data available for this commodity'
            }
        
        # Get current price (most recent)
        current_data = self.price_data[
            (self.price_data['Commodity'] == commodity) & 
            (self.price_data['State'] == state)
        ]
        
        if current_data.empty:
            # Use average across all states
            current_data = self.price_data[self.price_data['Commodity'] == commodity]
            
        if current_data.empty:
            return {
                'current_price': None,
                'predicted_price': None,
                'confidence_interval': None,
                'recommendation': 'INSUFFICIENT_DATA',
                'reason': 'No data for this commodity in any state'
            }
        
        current_price = float(current_data['Modal_Price'].iloc[-1])
        
        # Calculate prediction based on trend and volatility
        trend = stats.get('trend', 0)
        volatility = stats.get('volatility', 0.1)
        mean_price = stats.get('mean_price', current_price)
        
        # Trend-based prediction
        trend_factor = 1 + (trend * 0.1 * days_ahead / 7)  # Scale trend over time
        
        # Mean reversion factor (prices tend to revert to mean)
        distance_from_mean = (current_price - mean_price) / mean_price
        reversion_factor = 1 - (distance_from_mean * 0.05 * days_ahead / 7)
        
        # Combined prediction
        predicted_price = current_price * trend_factor * reversion_factor
        
        # Confidence interval based on volatility
        std_dev = stats.get('std_price', current_price * 0.1)
        confidence_range = std_dev * np.sqrt(days_ahead / 7) * 1.96  # 95% CI
        
        confidence_interval = {
            'lower': max(0, predicted_price - confidence_range),
            'upper': predicted_price + confidence_range
        }
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            current_price, predicted_price, confidence_interval, 
            trend, volatility, days_ahead
        )
        
        return {
            'commodity': commodity,
            'state': state,
            'current_price': round(current_price, 2),
            'predicted_price': round(predicted_price, 2),
            'price_change_pct': round(((predicted_price - current_price) / current_price) * 100, 1),
            'confidence_interval': {
                'lower': round(confidence_interval['lower'], 2),
                'upper': round(confidence_interval['upper'], 2)
            },
            'prediction_date': (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d'),
            'days_ahead': days_ahead,
            'recommendation': recommendation['action'],
            'recommendation_reason': recommendation['reason'],
            'confidence_score': recommendation['confidence'],
            'price_trend': 'UP' if trend > 0.1 else 'DOWN' if trend < -0.1 else 'STABLE',
            'volatility_level': 'HIGH' if volatility > 0.3 else 'MEDIUM' if volatility > 0.15 else 'LOW'
        }
    
    def _generate_recommendation(self, current_price: float, predicted_price: float,
                                confidence_interval: Dict, trend: float, 
                                volatility: float, days_ahead: int) -> Dict:
        """Generate sell/hold/wait recommendation."""
        
        price_change_pct = ((predicted_price - current_price) / current_price) * 100
        
        # High confidence if volatility is low and we have good data
        confidence = 'HIGH' if volatility < 0.2 else 'MEDIUM' if volatility < 0.4 else 'LOW'
        
        # Decision logic
        if price_change_pct > 5:
            return {
                'action': 'WAIT',
                'reason': f'Prices expected to rise by {price_change_pct:.1f}% in {days_ahead} days. Consider delaying sale.',
                'confidence': confidence
            }
        elif price_change_pct < -5:
            return {
                'action': 'SELL_NOW',
                'reason': f'Prices expected to drop by {abs(price_change_pct):.1f}% in {days_ahead} days. Consider selling immediately.',
                'confidence': confidence
            }
        elif price_change_pct < -2:
            return {
                'action': 'SELL_SOON',
                'reason': f'Slight downward trend expected ({price_change_pct:.1f}%). Consider selling within a few days.',
                'confidence': confidence
            }
        elif price_change_pct > 2:
            return {
                'action': 'HOLD',
                'reason': f'Moderate price increase expected ({price_change_pct:.1f}%). Can wait for better prices.',
                'confidence': confidence
            }
        else:
            return {
                'action': 'NEUTRAL',
                'reason': f'Prices expected to remain stable (±{abs(price_change_pct):.1f}%). Sell based on your immediate needs.',
                'confidence': confidence
            }
    
    def get_price_history(self, commodity: str, state: str, 
                         days: int = 30) -> List[Dict]:
        """Get historical price data for charting."""
        if self.price_data is None:
            return []
            
        data = self.price_data[
            (self.price_data['Commodity'] == commodity) & 
            (self.price_data['State'] == state)
        ].copy()
        
        if data.empty:
            # Try without state filter
            data = self.price_data[
                self.price_data['Commodity'] == commodity
            ].copy()
        
        if data.empty:
            return []
            
        # Get last N days
        data = data.tail(days)
        
        return [
            {
                'date': row['Arrival_Date'].strftime('%Y-%m-%d'),
                'modal_price': float(row['Modal_Price']),
                'min_price': float(row['Min_Price']),
                'max_price': float(row['Max_Price']),
                'market': row['Market']
            }
            for _, row in data.iterrows()
        ]
    
    def get_market_insights(self, commodity: str, state: str) -> Dict:
        """Get comprehensive market insights."""
        stats = self.commodity_stats.get(commodity, {})
        
        if not stats:
            return {'error': 'No data available'}
            
        # Get recent price data
        recent_data = self.price_data[
            (self.price_data['Commodity'] == commodity) & 
            (self.price_data['State'] == state)
        ] if state in stats.get('states', []) else self.price_data[
            self.price_data['Commodity'] == commodity
        ]
        
        if recent_data.empty:
            return {'error': 'No recent data available'}
            
        recent_prices = recent_data.tail(7)['Modal_Price']
        
        return {
            'commodity': commodity,
            'state': state if state in stats.get('states', []) else 'All States',
            'average_price': round(stats.get('mean_price', 0), 2),
            'price_range': {
                'min': round(stats.get('min_price', 0), 2),
                'max': round(stats.get('max_price', 0), 2)
            },
            'volatility': round(stats.get('volatility', 0) * 100, 1),
            'trend': stats.get('trend', 0),
            'recent_average': round(recent_prices.mean(), 2),
            'price_stability': 'STABLE' if stats.get('volatility', 1) < 0.2 else 'VOLATILE',
            'available_states': stats.get('states', [])
        }


# Singleton instance
_price_predictor: Optional[MandiPricePredictor] = None

def get_price_predictor(data_path: str) -> MandiPricePredictor:
    """Get or create price predictor instance."""
    global _price_predictor
    if _price_predictor is None:
        _price_predictor = MandiPricePredictor(data_path)
        _price_predictor.load_data()
    return _price_predictor


if __name__ == "__main__":
    # Test the predictor
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "model2_training.csv")
    
    predictor = MandiPricePredictor(data_path)
    predictor.load_data()
    
    print("=== Price Prediction Test ===")
    
    # Test predictions for common crops
    test_cases = [
        ('Tomato', 'Tamil Nadu'),
        ('Onion', 'Maharashtra'),
        ('Pomegranate', 'Gujarat'),
    ]
    
    for commodity, state in test_cases:
        print(f"\n{commodity} in {state}:")
        prediction = predictor.predict_price(commodity, state, days_ahead=7)
        print(f"  Current: ₹{prediction['current_price']}")
        print(f"  Predicted (7 days): ₹{prediction['predicted_price']}")
        print(f"  Change: {prediction['price_change_pct']}%")
        print(f"  Recommendation: {prediction['recommendation']}")
        print(f"  Reason: {prediction['recommendation_reason']}")
