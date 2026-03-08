import pandas as pd
import os
from datetime import datetime

def process_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_path = os.path.join(base_dir, "data", "real_mandi_prices_raw.csv")
    enhanced_path = os.path.join(base_dir, "data", "mandi_prices_enhanced.csv")
    output_path = os.path.join(base_dir, "data", "mandi_prices_combined.csv")
    
    if not os.path.exists(raw_path):
        print(f"Error: {raw_path} not found.")
        return

    # Load raw data
    raw_df = pd.read_csv(raw_path)
    print(f"Loaded {len(raw_df)} raw records.")
    
    # Mapping for commodities
    commodity_map = {
        'Paddy(Common)': 'rice',
        'Wheat': 'wheat',
        'Maize': 'maize',
        'Bengal Gram(Gram)(Whole)': 'chickpea',
        'Arhar(Tur/Red Gram)(Whole)': 'pigeonpeas',
        # Add more if needed
    }
    
    # Clean and transform raw data
    processed_records = []
    for _, row in raw_df.iterrows():
        commodity = commodity_map.get(row['Commodity'], row['Commodity'].lower())
        
        # Convert date from DD-MM-YYYY to YYYY-MM-DD
        try:
            date_obj = datetime.strptime(row['Price Date'], '%d-%m-%Y')
            date_str = date_obj.strftime('%Y-%m-%d')
        except:
            date_str = row['Price Date']
            
        processed_records.append({
            'state': row['State'],
            'commodity': commodity,
            'modal_price': row['Modal Price'],
            'min_price': row['Min Price'],
            'max_price': row['Max Price'],
            'date': date_str,
            'source': 'Agmarknet_Real_Scraping'
        })
    
    processed_df = pd.DataFrame(processed_records)
    
    # Load existing enhanced data if it exists
    if os.path.exists(enhanced_path):
        enhanced_df = pd.read_csv(enhanced_path)
        print(f"Loaded {len(enhanced_df)} existing enhanced records.")
        
        # Combine data
        combined_df = pd.concat([enhanced_df, processed_df], ignore_index=True)
        # Remove duplicates (same state, commodity, date, and price)
        combined_df = combined_df.drop_duplicates(subset=['state', 'commodity', 'date', 'modal_price'])
    else:
        combined_df = processed_df
        
    # Save combined data
    combined_df.to_csv(output_path, index=False)
    print(f"Saved {len(combined_df)} records to {output_path}")
    
    # Also overwrite the enhanced path so the model picks it up? 
    # Or update the model to use the combined path.
    # Let's overwrite enhanced path to be safe.
    combined_df.to_csv(enhanced_path, index=False)
    print(f"Updated {enhanced_path}")

if __name__ == "__main__":
    process_data()
