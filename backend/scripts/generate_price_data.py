"""
Generate comprehensive price data for all crops in the system.
This creates realistic mandi price data for all crops, fruits, and vegetables.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load crop metadata
with open(os.path.join(BASE_DIR, 'data', 'crop_metadata.json'), 'r') as f:
    crop_metadata = json.load(f)

# Realistic base prices for each crop (₹ per quintal) based on market data
# These are average modal prices from various APMCs across India
CROP_BASE_PRICES = {
    # Cereals
    "rice": 2200,
    "wheat": 2400,
    "maize": 2100,
    
    # Pulses
    "chickpea": 5200,
    "kidneybeans": 4800,
    "pigeonpeas": 6800,
    "mothbeans": 5500,
    "mungbean": 7200,
    "blackgram": 5800,
    "lentil": 5400,
    
    # Fruits
    "pomegranate": 6500,
    "banana": 2800,
    "mango": 4500,
    "grapes": 5500,
    "watermelon": 1200,
    "muskmelon": 1800,
    "apple": 8000,
    "orange": 3500,
    "papaya": 2200,
    "coconut": 4500,
    
    # Cash Crops
    "cotton": 6200,
    "jute": 4800,
    
    # Plantation
    "coffee": 12000,
    "tea": 2800,
    
    # Oilseeds
    "mustard": 5500,
    
    # Vegetables
    "tomato": 1800,
    "onion": 2200,
    "potato": 1600,
    "brinjal": 2000,
    "green chilli": 4500,
    "carrot": 2400,
    "cabbage": 1400,
    "cauliflower": 1800,
    "bottle gourd": 1200,
    "bitter gourd": 3500,
    "pumpkin": 1000,
    "bhindi": 2800,
    "garlic": 8000,
    "ginger": 6000,
    "coriander": 3500,
    "drumstick": 4500,
    "sweet potato": 1800,
    "tapioca": 1500,
}

# State-wise price multipliers (some states have higher/lower prices due to demand/transport)
STATE_MULTIPLIERS = {
    "Maharashtra": 1.05,
    "Gujarat": 1.02,
    "Punjab": 1.08,
    "Haryana": 1.06,
    "Uttar Pradesh": 0.95,
    "Madhya Pradesh": 0.92,
    "Rajasthan": 0.90,
    "Karnataka": 1.00,
    "Andhra Pradesh": 0.98,
    "Tamil Nadu": 1.02,
    "Telangana": 0.97,
    "West Bengal": 0.94,
    "Bihar": 0.91,
    "Odisha": 0.93,
    "Kerala": 1.12,
    "Assam": 0.96,
    "Chhattisgarh": 0.89,
    "Jammu & Kashmir": 1.15,
    "Himachal Pradesh": 1.10,
    "Uttarakhand": 1.03,
    "Jharkhand": 0.90,
    "Goa": 1.20,
    "Nagaland": 1.08,
    "Mizoram": 1.05,
}

# Market names by state (major APMCs)
STATE_MARKETS = {
    "Maharashtra": ["Pune", "Nashik", "Nagpur", "Mumbai", "Kolhapur"],
    "Gujarat": ["Ahmedabad", "Surat", "Rajkot", "Vadodara", "Jamnagar"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Haryana": ["Karnal", "Hisar", "Ambala", "Rohtak", "Panipat"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
    "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Tirupati", "Kurnool"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
    "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore"],
    "Himachal Pradesh": ["Shimla", "Mandi", "Solan", "Dharamshala", "Kullu"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
    "Goa": ["Panaji", "Margao", "Vasco", "Mapusa", "Ponda"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
    "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib"],
}

def generate_price_data():
    """Generate price data for all crops across their traditional states."""
    records = []
    
    # Generate data for the last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    for crop_key, metadata in crop_metadata.items():
        commodity_name = metadata.get('mandi_commodity', crop_key.title())
        base_price = CROP_BASE_PRICES.get(crop_key, 3000)  # Default if not found
        traditional_states = metadata.get('traditional_states', [])
        
        for state in traditional_states:
            # Get state multiplier
            multiplier = STATE_MULTIPLIERS.get(state, 1.0)
            
            # Get markets for this state
            markets = STATE_MARKETS.get(state, [f"{state} Market"])
            
            for market in markets:
                # Generate daily price entries
                for day_offset in range(31):
                    current_date = start_date + timedelta(days=day_offset)
                    date_str = current_date.strftime('%d/%m/%Y')
                    
                    # Add some randomness to prices (±15% variation)
                    daily_variation = np.random.uniform(0.85, 1.15)
                    
                    # Add weekly seasonality (prices slightly higher on weekends)
                    day_of_week = current_date.weekday()
                    weekend_factor = 1.02 if day_of_week >= 5 else 1.0
                    
                    modal_price = base_price * multiplier * daily_variation * weekend_factor
                    
                    # Min and max prices around modal
                    min_price = modal_price * np.random.uniform(0.85, 0.95)
                    max_price = modal_price * np.random.uniform(1.05, 1.20)
                    
                    record = {
                        'State': state,
                        'District': market,
                        'Market': f"{market} APMC",
                        'Commodity': commodity_name,
                        'Variety': 'Other',
                        'Grade': 'FAQ' if np.random.random() > 0.3 else 'Local',
                        'Arrival_Date': date_str,
                        'Min_Price': round(min_price, 2),
                        'Max_Price': round(max_price, 2),
                        'Modal_Price': round(modal_price, 2)
                    }
                    records.append(record)
    
    return pd.DataFrame(records)

def main():
    print("Generating comprehensive price data for all crops...")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate the data
    df = generate_price_data()
    
    # Sort by date
    df['Arrival_Date_Parsed'] = pd.to_datetime(df['Arrival_Date'], format='%d/%m/%Y')
    df = df.sort_values('Arrival_Date_Parsed')
    df = df.drop('Arrival_Date_Parsed', axis=1)
    
    # Save to CSV
    output_path = os.path.join(BASE_DIR, 'data', 'model2_training_extended.csv')
    df.to_csv(output_path, index=False)
    
    print(f"Generated {len(df)} price records")
    print(f"Saved to: {output_path}")
    
    # Print summary
    print("\nSummary by Commodity:")
    commodity_summary = df.groupby('Commodity').agg({
        'Modal_Price': ['mean', 'min', 'max', 'count']
    }).round(2)
    print(commodity_summary)
    
    print("\nSummary by State:")
    state_summary = df.groupby('State').size().sort_values(ascending=False)
    print(state_summary.head(10))

if __name__ == "__main__":
    main()
