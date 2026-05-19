import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../ml')
MODEL_PATH = os.path.join(MODEL_DIR, 'fraud_model.pkl')

def train_fraud_model():
    print("Generating synthetic data for fraud detection...")
    
    # 400 legitimate + 100 fraudulent
    n_legit = 400
    n_fraud = 100

    # Legitimate features:
    data = []
    for _ in range(n_legit):
        data.append({
            "has_high_risk_keyword": 0,
            "has_medium_risk_keyword": np.random.choice([0, 1], p=[0.9, 0.1]),
            "url_reachable": 1,
            "trusted_domain": np.random.choice([0, 1], p=[0.2, 0.8]),
            "scholarship_amount_ratio": np.random.uniform(0.1, 0.9),
            "deadline_too_close": 0,
            "has_official_email": 1,
            "cgpa_min_zero": 0,
            "has_apply_steps": 1,
            "description_length": np.random.randint(200, 1500)
        })

    # Fraudulent features:
    for _ in range(n_fraud):
        data.append({
            "has_high_risk_keyword": 1,
            "has_medium_risk_keyword": 1,
            "url_reachable": 0,
            "trusted_domain": 0,
            "scholarship_amount_ratio": np.random.uniform(1.2, 3.5),
            "deadline_too_close": np.random.choice([0, 1]),
            "has_official_email": 0,
            "cgpa_min_zero": 1,
            "has_apply_steps": 0,
            "description_length": np.random.randint(20, 150)
        })

    df = pd.DataFrame(data)
    print(f"Training IsolationForest on {len(df)} samples...")
    
    # contamination=0.1 means we expect 10% anomalies
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(df)
    
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH} ✅")

if __name__ == "__main__":
    train_fraud_model()
