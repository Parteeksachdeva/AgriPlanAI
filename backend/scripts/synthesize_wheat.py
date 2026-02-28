import pandas as pd
import numpy as np
import os

def synthesize_wheat_data(output_path):
    # Typical Rabi conditions for Wheat in Punjab
    # N: 80-120, P: 40-60, K: 30-50
    # Temp: 15-25, Humidity: 30-60, ph: 6-7.5, Rainfall: 50-150 (Rabi is dry)
    
    num_samples = 100
    data = {
        'N': np.random.randint(80, 121, num_samples),
        'P': np.random.randint(40, 61, num_samples),
        'K': np.random.randint(30, 51, num_samples),
        'temperature': np.random.uniform(15, 25, num_samples),
        'humidity': np.random.uniform(30, 60, num_samples),
        'ph': np.random.uniform(6.0, 7.5, num_samples),
        'rainfall': np.random.uniform(50, 150, num_samples),
        'label': ['wheat'] * num_samples
    }
    
    df_new = pd.DataFrame(data)
    
    if os.path.exists(output_path):
        df_old = pd.read_csv(output_path)
        # Check if wheat already exists
        if 'wheat' in df_old['label'].unique():
            print("Wheat already exists in training data.")
        else:
            df_combined = pd.concat([df_old, df_new], ignore_index=True)
            df_combined.to_csv(output_path, index=False)
            print(f"Added {num_samples} wheat samples to {output_path}")
    else:
        print(f"Training file not found: {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level from scripts/ to backend/
    train_path = os.path.normpath(os.path.join(base_dir, "..", "data", "model1_training.csv"))
    synthesize_wheat_data(train_path)
