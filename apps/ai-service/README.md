# 📝 MÉMO : Intégration du Micro-service IA avec PostgreSQL
**Destinataire :** Mamor (AI Service)
**Contexte :** Liaison des prédictions à la base de données Teddy pour supprimer les erreurs 404 et peupler les tables `parkings` et `parking_predictions`.

---

### 📂 1. Structure des fichiers concernés
Mamor doit intervenir dans le dossier `apps/ai-service/src/` :
*   `database.py` : (À créer) Gestion de la connexion.
*   `processor.py` : Insertion des données de base (Parkings).
*   `predictor.py` : Insertion des résultats de l'IA (Predictions).

---

### ⚙️ 2. Configuration de la Connexion (`apps/ai-service/src/database.py`)
PostgreSQL gère les IDs automatiquement (`GENERATED ALWAYS AS IDENTITY`).

```python
import psycopg2
import os

def get_connection():
    # Connexion au conteneur 'db' défini dans le docker-compose
    return psycopg2.connect(
        host="localhost", # "db" si exécuté via Docker network
        database="ia_mobility",
        user="postgres",
        password="votre_password", 
        port="5432"
    )
```

---

### 📥 3. Initialisation des Parkings (`apps/ai-service/src/processor.py`)
Le but est de remplir la table `parkings` pour que le Backend de Boubacar puisse les lister. On utilise `RETURNING id` pour récupérer l'ID créé par la BDD.

```python
def save_parkings_to_sql(parkings_list):
    conn = get_connection()
    cur = conn.cursor()
    
    # On insère les datas sans l'ID (la BDD le génère)
    query = """
        INSERT INTO parkings (name, address, latitude, longitude, capacity, available_spots)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO UPDATE SET available_spots = EXCLUDED.available_spots
        RETURNING id;
    """
    
    for p in parkings_list:
        cur.execute(query, (
            p['name'], p['address'], p['latitude'], 
            p['longitude'], p['capacity'], p['available_spots']
        ))
        # Optionnel : récupérer l'id si besoin immédiat
        parking_id = cur.fetchone()[0]
        
    conn.commit()
    cur.close()
    conn.close()
```

---

### 📊 4. Archivage des Prédictions (`apps/ai-service/src/predictor.py`)
Chaque fois que l'IA tourne, elle doit insérer une ligne dans `parking_predictions`. Le `parking_id` doit correspondre à un ID existant dans la table `parkings`.

```python
def log_prediction_to_sql(parking_id, predicted_spots, confidence_score):
    conn = get_connection()
    cur = conn.cursor()
    
    # L'ID de la prédiction est auto-généré, on ne l'envoie pas.
    query = """
        INSERT INTO parking_predictions 
        (parking_id, predicted_available_spots, confidence, prediction_time)
        VALUES (%s, %s, %s, NOW());
    """
    
    cur.execute(query, (parking_id, predicted_spots, confidence_score))
    
    conn.commit()
    cur.close()
    conn.close()
```

---

### ⚠️ Points de vigilance pour Mamor :
1.  **Le format JSON** : Correction impérative de `processor.py` pour lire le fichier global via `json.load(f)` (plus de lecture ligne par ligne).
2.  **L'ordre d'exécution** : Il doit d'abord exécuter le script qui remplit la table `parkings` AVANT d'essayer d'insérer des prédictions (à cause de la contrainte `FOREIGN KEY`).
3.  **Les types** : Attention à bien passer des `float` pour `latitude/longitude` et des `int` pour `capacity`.

---

