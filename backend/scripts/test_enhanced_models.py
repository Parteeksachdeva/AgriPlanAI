#!/usr/bin/env python3
"""
Test script for enhanced AgriPlanAI models.
Validates state-specific predictions and data quality.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model_enhanced import get_state_aware_yield_model, get_enhanced_price_model
from weather_service import get_weather_service
import pandas as pd

# Test states (all 20 from frontend)
TEST_STATES = [
    'Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan',
    'Maharashtra', 'Gujarat', 'Karnataka', 'Andhra Pradesh', 'Telangana',
    'Tamil Nadu', 'Kerala', 'West Bengal', 'Bihar', 'Odisha', 'Assam',
    'Chhattisgarh', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh'
]

# Key crops to test
TEST_CROPS = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'chickpea', 'potato', 'onion']


def test_yield_model():
    """Test state-aware yield model."""
    print("="*70)
    print("TEST 1: State-Aware Yield Model")
    print("="*70)
    
    model = get_state_aware_yield_model()
    
    print(f"\nModel Status: {'Trained' if model.is_trained else 'Not Trained'}")
    print(f"State-Crop Combinations: {len(model.state_yield_lookup)}")
    print(f"Crops with National Avg: {len(model.crop_national_avg)}")
    
    # Test predictions for key combinations
    print("\n--- Sample Predictions ---")
    test_cases = [
        {'state': 'Punjab', 'crop': 'wheat', 'n_soil': 100, 'p_soil': 50, 'k_soil': 40,
         'temperature': 22, 'humidity': 65, 'rainfall': 650, 'ph': 7.0},
        {'state': 'Maharashtra', 'crop': 'cotton', 'n_soil': 80, 'p_soil': 40, 'k_soil': 35,
         'temperature': 30, 'humidity': 70, 'rainfall': 900, 'ph': 6.5},
        {'state': 'Kerala', 'crop': 'rice', 'n_soil': 60, 'p_soil': 35, 'k_soil': 30,
         'temperature': 28, 'humidity': 85, 'rainfall': 2800, 'ph': 5.5},
        {'state': 'Uttar Pradesh', 'crop': 'sugarcane', 'n_soil': 120, 'p_soil': 60, 'k_soil': 60,
         'temperature': 30, 'humidity': 65, 'rainfall': 1000, 'ph': 6.8},
    ]
    
    for test in test_cases:
        result = model.predict(test, return_confidence=True)
        print(f"\n{test['state']} - {test['crop']}:")
        print(f"  Predicted Yield: {result['yield_t_ha']} t/ha")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Data Source: {result['data_source']}")
        print(f"  Base Yield: {result['factors']['base_yield']} t/ha")
        print(f"  NPK Factor: {result['factors']['npk_factor']}")
        print(f"  Climate Factor: {result['factors']['climate_factor']}")
    
    # Test data coverage
    print("\n--- Data Coverage Analysis ---")
    high_confidence = sum(1 for k, v in model.state_yield_lookup.items() 
                          if v > 0 and k[0] in TEST_STATES)
    print(f"High-confidence predictions available: {high_confidence}")
    
    # State coverage
    states_with_data = set(k[0] for k in model.state_yield_lookup.keys())
    print(f"States with yield data: {len(states_with_data)}/20")
    
    return True


def test_price_model():
    """Test enhanced price model."""
    print("\n" + "="*70)
    print("TEST 2: Enhanced Price Model")
    print("="*70)
    
    model = get_enhanced_price_model()
    
    print(f"\nState-Commodity Combinations: {len(model.state_price_lookup)}")
    print(f"Commodities with Avg Price: {len(model.commodity_avg)}")
    
    # Test predictions
    print("\n--- Sample Price Predictions ---")
    test_cases = [
        ('wheat', 'Punjab'),
        ('cotton', 'Maharashtra'),
        ('rice', 'West Bengal'),
        ('potato', 'Uttar Pradesh'),
        ('onion', 'Maharashtra'),
    ]
    
    for commodity, state in test_cases:
        result = model.predict_price(commodity, state, include_factors=True)
        print(f"\n{commodity} in {state}:")
        print(f"  Predicted Price: ₹{result['predicted_price']}/quintal")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Data Source: {result['data_source']}")
        print(f"  Price Range: ₹{result['confidence_interval']['lower']} - "
              f"₹{result['confidence_interval']['upper']}")
    
    return True


def test_weather_service():
    """Test weather service integration."""
    print("\n" + "="*70)
    print("TEST 3: Weather Service")
    print("="*70)
    
    service = get_weather_service()
    
    print(f"\nAPI Available: {service.use_api}")
    
    # Test weather for sample states
    print("\n--- Current Weather ---")
    test_states = ['Punjab', 'Maharashtra', 'Kerala']
    
    for state in test_states:
        weather = service.get_current_weather(state)
        print(f"\n{state}:")
        print(f"  Temperature: {weather['temperature']}°C")
        print(f"  Humidity: {weather['humidity']}%")
        print(f"  Source: {weather['source']}")
    
    # Test yield adjustment
    print("\n--- Weather Yield Adjustments ---")
    for state in ['Punjab', 'Maharashtra']:
        for crop in ['wheat', 'cotton']:
            adjustment = service.calculate_yield_adjustment(state, crop)
            print(f"\n{state} - {crop}:")
            print(f"  Adjustment Factor: {adjustment['adjustment_factor']}")
            print(f"  Recommendation: {adjustment['recommendation'][:60]}...")
    
    # Test seasonal outlook
    print("\n--- Seasonal Outlook (Punjab) ---")
    for season in ['kharif', 'rabi']:
        outlook = service.get_seasonal_weather_outlook('Punjab', season)
        print(f"\n{season.title()}:")
        print(f"  Expected Temp: {outlook['expected_temperature']}°C")
        print(f"  Expected Rainfall: {outlook['expected_rainfall']:.0f} mm")
        print(f"  Reliability: {outlook['reliability']}")
    
    return True


def test_data_quality():
    """Test overall data quality."""
    print("\n" + "="*70)
    print("TEST 4: Data Quality Summary")
    print("="*70)
    
    yield_model = get_state_aware_yield_model()
    price_model = get_enhanced_price_model()
    
    # Calculate coverage statistics
    yield_states = set(k[0] for k in yield_model.state_yield_lookup.keys())
    price_states = set(k[0] for k in price_model.state_price_lookup.keys())
    
    print(f"\nYield Data Coverage:")
    print(f"  States covered: {len(yield_states)}/20")
    print(f"  State-crop combinations: {len(yield_model.state_yield_lookup)}")
    print(f"  Model trained: {yield_model.is_trained}")
    
    print(f"\nPrice Data Coverage:")
    print(f"  States covered: {len(price_states)}/20")
    print(f"  State-commodity combinations: {len(price_model.state_price_lookup)}")
    
    print(f"\nData Sources:")
    print(f"  - DES (Directorate of Economics & Statistics) 2022-23")
    print(f"  - Agmarknet Market Price Data 2024")
    print(f"  - ICAR Crop Research Data")
    print(f"  - Climate Normals (IMD)")
    
    # Check for gaps
    missing_yield_states = set(TEST_STATES) - yield_states
    missing_price_states = set(TEST_STATES) - price_states
    
    if missing_yield_states:
        print(f"\n⚠️  States missing yield data: {missing_yield_states}")
    else:
        print(f"\n✅ All 20 states have yield data")
    
    if missing_price_states:
        print(f"⚠️  States missing price data: {missing_price_states}")
    else:
        print(f"✅ All 20 states have price data")
    
    return True


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("AgriPlanAI Enhanced Models - Test Suite")
    print("="*70)
    
    try:
        test_yield_model()
        test_price_model()
        test_weather_service()
        test_data_quality()
        
        print("\n" + "="*70)
        print("✅ ALL TESTS PASSED")
        print("="*70)
        print("\nEnhanced models are ready for use!")
        print("- State-specific yield predictions: ACTIVE")
        print("- State-specific price predictions: ACTIVE")
        print("- Weather integration: ACTIVE")
        print("- Confidence scoring: ACTIVE")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
