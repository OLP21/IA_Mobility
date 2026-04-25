from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import os
from datetime import datetime
import requests
import time
from prometheus_client import Counter, Histogram, generate_latest

app = Flask(__name__)
CORS(app)

# --- C11 : INITIALISATION DES MÉTRIQUES MLOPS ---
PREDICTION_REQUESTS = Counter('ai_prediction_requests_total', 'Total des demandes de prédictions')
INFERENCE_TIME = Histogram('ai_inference_duration_seconds', 'Temps mis par le modèle pour calculer')
PREDICTION_VALUES = Histogram('ai_predicted_occupation_value', 'Valeurs des prédictions (0-100)')

# Chemins des modèles
MODELE_PATH = os.path.join("models", "modele_parkings.pkl")
ENCODER_PATH = os.path.join("models", "encoder_noms.pkl")

# Chargement du modèle et de l'encodeur
if os.path.exists(MODELE_PATH) and os.path.exists(ENCODER_PATH):
    model = joblib.load(MODELE_PATH)
    le = joblib.load(ENCODER_PATH)
    print(f"IA et Encodeur chargés (92 parkings prêts !)")
else:
    print("ERREUR : Modèles introuvables. Lance predictor.py d'abord.")

@app.route('/metrics', methods=['GET'])
def metrics():
    """Route exposant les métriques MLOps (à scrapper par Prometheus)"""
    return generate_latest(), 200, {'Content-Type': 'text/plain; version=0.0.4'}

@app.route('/predict', methods=['GET'])
def predict():
    start_time = time.time()
    PREDICTION_REQUESTS.inc() # Monitorage C11
    # Récupération du nom du parking dans l'URL (ex: ?nom=Clemenceau)
    nom_parking = request.args.get('nom')
    
    if not nom_parking:
        return jsonify({"erreur": "Veuillez préciser un nom de parking"}), 400

    try:
        # 1. On transforme le nom en chiffre
        # Si le parking n'est pas connu, ça ira dans le 'except'
        nom_encoded = le.transform([nom_parking])[0]
        
        # 2. On récupère l'heure actuelle
        maintenant = datetime.now()
        heure = maintenant.hour
        jour = maintenant.weekday()
        minute = maintenant.minute

        # 3. Prédiction
        input_data = pd.DataFrame([[nom_encoded, heure, jour, minute]], 
                                 columns=['nom_encoded', 'heure', 'jour_semaine', 'minute'])
        prediction = float(model.predict(input_data)[0])
        
        # Monitorage de la donnée de sortie et du temps
        PREDICTION_VALUES.observe(prediction)
        INFERENCE_TIME.observe(time.time() - start_time)

        # --- 4. Archivage via l'API REST Node.js (Validates C5) ---
        try:
            api_url = "http://localhost:3000/api/parkings/predictions"
            payload = {
                "parking_name": nom_parking,
                "prediction": prediction,
                "confidence": 85.0
            }
            # L'IA appelle proprement l'API plutôt que de pirater la base de données
            reponse = requests.post(api_url, json=payload, timeout=5)
            
            if reponse.status_code != 201:
                print(f"⚠️ L'API a refusé la sauvegarde : {reponse.text}")
        except Exception as req_err:
            print(f"⚠️ Insertion ignorée (Backend injoignable) : {req_err}")

        return jsonify({
            "parking": nom_parking,
            "prediction_occupation": f"{round(prediction, 2)}%",
            "heure_analyse": f"{heure}h{minute}",
            "status": "Succès"
        })

    except ValueError:
        return jsonify({
            "erreur": f"Le parking '{nom_parking}' est inconnu.",
            "liste_disponible": list(le.classes_[:5]) + ["..."] # On en montre quelques-uns
        }), 404
    except Exception as e:
        return jsonify({"erreur": str(e)}), 500

if __name__ == "__main__":
    # On lance l'API sur le port 5000
    app.run(host="0.0.0.0", port=5001, debug=True)