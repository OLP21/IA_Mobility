import pandas as pd
import json
import os
import sys

# Set path so we can import src.database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from src.database import get_connection
except ImportError:
    pass # Permet de fonctionner même sans BDD si lancé de la racine

# Chemins des fichiers

# Change cette ligne pour correspondre au vrai nom dans ton dossier
FICHIER_RAW = os.path.join("data", "raw", "historique_parkings.json")
DOSSIER_PROCESSED = os.path.join("data", "processed")
FICHIER_CLEAN = os.path.join(DOSSIER_PROCESSED, "data_training.csv")

def transformer_donnees():
    print(f"--- Démarrage de la transformation ---")
    
    # 1. Vérification de l'existence du fichier source
    if not os.path.exists(FICHIER_RAW):
        print(f"❌ ERREUR : Le fichier {FICHIER_RAW} est introuvable.")
        return

    # 2. Création du dossier processed s'il n'existe pas
    if not os.path.exists(DOSSIER_PROCESSED):
        os.makedirs(DOSSIER_PROCESSED)

    all_rows = []
    
    # 3. Lecture et extraction des données
    try:
        with open(FICHIER_RAW, "r") as f:
            capture = json.load(f)
            
        date_capture = pd.to_datetime(capture.get("sauvegarde_le"))
        
        # --- Connexion BDD pour insérer les parkings statiques ---
        conn = None
        cur = None
        try:
            conn = get_connection()
            cur = conn.cursor()
            db_active = True
        except Exception as e:
            print(f"⚠️ BDD indisponible, on continue sans SQL : {e}")
            db_active = False

        if db_active:
            try:
                cur.execute("ALTER TABLE parkings ADD CONSTRAINT parkings_name_key UNIQUE (name);")
                conn.commit()
            except Exception:
                conn.rollback() # It already exists
            
        # --- TON BLOC DE CODE INTÉGRÉ ICI ---
        for parking in capture.get("donnees", []):
            prop = parking.get("properties", {})
            nom = prop.get("nom", "Inconnu")
                    
            # On teste avec des valeurs par défaut précises
            total = prop.get("total")
            if total is None: total = prop.get("np_total")
            if total is None: total = prop.get("np_global")
            
            libres = prop.get("libres")
            if libres is None: libres = prop.get("nb_places_disponibles")

            # --- LE TEST DE VERITE ---
            if total is not None and total > 0:
                # Si on a un total mais pas de "libres", on met 0 au lieu de rien
                libres_clean = libres if libres is not None else 0
                occ_pct = (total - libres_clean) / total * 100
                
                # => INSERTION BDD (Parkings statiques)
                if db_active:
                    lat = parking.get("geometry", {}).get("coordinates", [0, 0])[1]
                    lon = parking.get("geometry", {}).get("coordinates", [0, 0])[0]
                    adresse = prop.get("adresse", prop.get("adresse", "Pas d'adresse"))
                    
                    query = """
                        INSERT INTO parkings (name, address, latitude, longitude, capacity, available_spots)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (name) DO UPDATE SET available_spots = EXCLUDED.available_spots;
                    """
                    cur.execute(query, (nom, adresse, lat, lon, total, libres_clean))
                    
                # => APPEND AU CSV
                all_rows.append({
                    "nom": nom,
                    "total": total,
                    "libres": libres_clean,
                    "occupation_pct": round(occ_pct, 2),
                    "heure": date_capture.hour,
                    "jour_semaine": date_capture.dayofweek,
                    "minute": date_capture.minute
                })
            else:
                pass # Silently ignore invalid lots for clean console

        if db_active:
            conn.commit()
            cur.close()
            conn.close()

    except Exception as e:
        print(f"⚠️ Erreur de lecture JSON global : {e}")


    if all_rows:
        df = pd.DataFrame(all_rows)
        # Supprime les doublons si on a collecté plusieurs fois les mêmes données
        df = df.drop_duplicates()
        df.to_csv(FICHIER_CLEAN, index=False)
        print(f"✅ SUCCÈS : {len(df)} lignes enregistrées.")
        print(f"📊 Parkings différents dans le CSV : {df['nom'].nunique()}")
    else:
        print("⚠️ Aucune donnée n'a pu être extraite.")

if __name__ == "__main__":
    transformer_donnees()