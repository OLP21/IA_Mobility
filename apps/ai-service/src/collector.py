import requests
import json
import time
import os

# --- CONFIGURATION DES CHEMINS ---
# On trouve le dossier 'ai-service' (racine du projet Python)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Définition du chemin vers data/raw/
FICHIER_DEST = os.path.join(BASE_DIR, "data", "raw", "historique_parkings.json")

CLE = "UFM1S7RTLN" 
URL = f"https://data.bordeaux-metropole.fr/geojson?key={CLE}&typename=st_park_p"

def collecter():
    # 1. CRÉATION AUTO DES DOSSIERS (La sécurité)
    os.makedirs(os.path.dirname(FICHIER_DEST), exist_ok=True)
    
    try:
        response = requests.get(URL)
        if response.status_code == 200:
            data = response.json()
            nb_recus = len(data.get('features', []))
            print(f"📡 L'API a envoyé {nb_recus} parkings.")
            
            capture = {
                "sauvegarde_le": time.strftime("%Y-%m-%d %H:%M:%S"),
                "donnees": data['features']
            }
            
            # 2. Ecriture du fichier JSON
            with open(FICHIER_DEST, "w") as f:
                # Utilisation de json.dump pour écrire le fichier JSON
                json.dump(capture, f, indent=4)
                
            print(f"[{capture['sauvegarde_le']}] Données enregistrées dans {FICHIER_DEST}")
        else:
            print(f"Erreur API : {response.status_code}")
    except Exception as e:
        print(f"Erreur : {e}")

if __name__ == "__main__":
    while True:
        collecter()
        print("Attente de 2 minutes...")
        time.sleep(120)