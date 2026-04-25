import pytest
import os
import joblib
import pandas as pd
from unittest.mock import patch, MagicMock

MODELE_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "modele_parkings.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "encoder_noms.pkl")

@pytest.fixture
def load_models():
    if not os.path.exists(MODELE_PATH) or not os.path.exists(ENCODER_PATH):
        pytest.skip("Modèles introuvables. Lance predictor.py avant de lancer les tests.")
        
    model = joblib.load(MODELE_PATH)
    encoder = joblib.load(ENCODER_PATH)
    return model, encoder

def test_model_prediction_range(load_models):
    model, encoder = load_models
    
    # 1. Vérification que l'encodeur fonctionne
    sample_classes = encoder.classes_
    assert len(sample_classes) > 0, "L'encodeur est vide"
    
    # 2. Simulation d'une entrée : Lundi, 14h30 pour un parking (le premier de la liste)
    fake_encoded = encoder.transform([sample_classes[0]])[0]
    
    # Structure attendue par XGBoost / Random Forest : [nom_encoded, heure, jour_semaine, minute]
    test_data = pd.DataFrame(
        [[fake_encoded, 14, 0, 30]], 
        columns=['nom_encoded', 'heure', 'jour_semaine', 'minute']
    )
    
    # 3. Exécution de l'inférence
    prediction = float(model.predict(test_data)[0])
    
    # 4. Assertions (Vérification des lois logiques du modèle pour la C12)
    assert prediction >= 0.0, "La prédiction (places libres ou %) ne peut pas être négative"
    assert prediction <= 10000.0, "La prédiction est aberrante"
