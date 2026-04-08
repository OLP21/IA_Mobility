import pandas as pd
import json
import os
import sys

# setup du chemin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from src.database import get_connection
except ImportError:
    pass # Permet de fonctionner même sans BDD si lancé de la racine

# Chemins des fichiers
FICHIER_RAW = os.path.join("data", "raw", "historique_parkings.json")
DOSSIER_PROCESSED = os.path.join("data", "processed")
FICHIER_CLEAN = os.path.join(DOSSIER_PROCESSED, "data_training.csv")

def transformer_donnees():
    print(f"--- Démarrage de la transformation ---")
    
    # 1. Vérification de l'existence du fichier JSON contenant les données brutes
    if not os.path.exists(FICHIER_RAW):
        print(f"❌ ERREUR : Le fichier {FICHIER_RAW} est introuvable.")
        return

    # 2. Création du dossier d'export cible s'il n'existe pas encore
    if not os.path.exists(DOSSIER_PROCESSED):
        os.makedirs(DOSSIER_PROCESSED)

    all_rows = []
    
    # 3. Extraction et chargement du fichier JSON
    try:
        with open(FICHIER_RAW, "r") as f:
            capture = json.load(f)
            
        # Conversion de la date de scraping pour en extraire l'heure et le jour plus tard
        date_capture = pd.to_datetime(capture.get("sauvegarde_le"))
        
        # --- Bloc de connexion à la base de données PostgreSQL ---
        # On tente de se connecter pour insérer la capacité statique des parkings en base.
        conn = None
        cur = None
        try:
            conn = get_connection()
            cur = conn.cursor()
            db_active = True
        except Exception as e:
            print(f"⚠️ BDD indisponible, on tourne uniquement sur fichier CSV : {e}")
            db_active = False

        if db_active:
            # On sécurise la table en s'assurant que le champ "nom" est une clé unique 
            try:
                cur.execute("ALTER TABLE parkings ADD CONSTRAINT parkings_name_key UNIQUE (name);")
                conn.commit()
            except Exception:
                # La contrainte existe déjà, on ignore l'erreur
                conn.rollback() 
            
        # --- Boucle principale de nettoyage des données ---
        for parking in capture.get("donnees", []):
            prop = parking.get("properties", {})
            nom = prop.get("nom", "Inconnu")
                    
            # Le format JSON source est asymétrique, on normalise la capacité totale 
            # (elle s'appelle 'total', 'np_total' ou 'np_global' selon les parkings)
            total = prop.get("total")
            if total is None: total = prop.get("np_total")
            if total is None: total = prop.get("np_global")
            
            # On fait de même pour les places libres ('libres' ou 'nb_places_disponibles')
            libres = prop.get("libres")
            if libres is None: libres = prop.get("nb_places_disponibles")

            # --- Validation de la donnée ---
            # On ignore mathématiquement les parkings fermés ou sans aucune place de base
            if total is not None and total > 0:
                # Si la place libre a un problème de remontée, on suppose par prudence qu'il y a 0 place
                libres_clean = libres if libres is not None else 0
                
                # Calcul direct : (Total - Libres) / Total = % d'Occupation (Feature de notre IA)
                occ_pct = (total - libres_clean) / total * 100
                
                # --- Étape A : Synchronisation en Base de Données ---
                if db_active:
                    lat = parking.get("geometry", {}).get("coordinates", [0, 0])[1]
                    lon = parking.get("geometry", {}).get("coordinates", [0, 0])[0]
                    # Parfois l'API renvoie des balises bizarres, on cherche la meilleure clé d'adresse
                    adresse = prop.get("adresse", prop.get("adresse", "Pas d'adresse"))
                    
                    # Si le parking existe déjà (CONFLIT sur le nom), on met uniquement à jour le nb. de places dispos
                    query = """
                        INSERT INTO parkings (name, address, latitude, longitude, capacity, available_spots)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (name) DO UPDATE SET available_spots = EXCLUDED.available_spots;
                    """
                    cur.execute(query, (nom, adresse, lat, lon, total, libres_clean))
                    
                # --- Étape B : Constitution du jeu d'entraînement ---
                # On formate la donnée en y injectant explicitement les marqueurs temporels
                # C'est ce qui permettra au modèle d'apprendre les pics horaires
                all_rows.append({
                    "nom": nom,
                    "total": total,
                    "libres": libres_clean,
                    "occupation_pct": round(occ_pct, 2),
                    "heure": date_capture.hour,
                    "jour_semaine": date_capture.dayofweek, # 0 = Lundi, 6 = Dimanche
                    "minute": date_capture.minute
                })
            else:
                # On ignore silencieusement ce lot car sa donnée est défectueuse ou inutilisable
                pass 

        if db_active:
            conn.commit()
            cur.close()
            conn.close()

    except Exception as e:
        print(f"⚠️ Erreur de lecture JSON global : {e}")

    # --- Étape C : Export au format CSV ---
    # Sauvegarde finale de la liste nettoyée pour l'entraînement du modèle IA
    if all_rows:
        df = pd.DataFrame(all_rows)
        # Nettoyage des lignes en double (utile si le script a tourné 2 fois sur la même minute par erreur)
        df = df.drop_duplicates()
        df.to_csv(FICHIER_CLEAN, index=False)
        print(f"✅ SUCCÈS : {len(df)} lignes enregistrées.")
        print(f"📊 Parkings différents dans le CSV : {df['nom'].nunique()}")
    else:
        print("⚠️ Aucune donnée n'a pu être extraite.")

if __name__ == "__main__":
    transformer_donnees()