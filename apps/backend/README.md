# 🚀 IA Mobility Backend

Backend du projet IA Mobility permettant le calcul d’itinéraires intelligents, l’enregistrement des trajets (8 tables PostgreSQL) et la gestion des données via Docker.

---

## 🛠 Technologies utilisées

- **Runtime** : Node.js (Express.js)
- **Base de données** : PostgreSQL (Dockerisée)
- **APIs** : OpenRouteService (Itinéraires), OpenWeatherMap (Météo)
- **Conteneurisation** : Docker & Docker Compose

---

## 📁 Structure du projet (Dockerisé)

```text
apps/backend/
├── src/
│   ├── config/db.js           # Connexion Pool PostgreSQL
│   ├── controllers/           # Logique métier (8 tables)
│   ├── routes/                # Endpoints API
│   ├── services/              # Appels API Externes (ORS, Weather)
│   └── server.js              # Point d'entrée Express
├── .env                       # Variables d'environnement
├── Dockerfile                 # Configuration de l'image Node
├── docker-compose.yml         # Orchestration (Node + PostgreSQL)
└── package.json
```

---

## 📦 Installation et Lancement

Le backend et la base de données sont désormais entièrement conteneurisés.

### 1. Configuration du fichier `.env`
À l'intérieur de `apps/backend/`, crée un fichier `.env` :

```env
PORT=3000
ORS_API_KEY=votre_cle_ors
WEATHER_API_KEY=votre_cle_openweathermap

# Configuration PostgreSQL (Docker)
DBHOST=db
DBPORT=5432
DBNAME=ia_mobility
DBUSER=postgres
DBPASSWORD=votre_password
```

### 2. Lancement avec Docker
Plus besoin d'installer PostgreSQL sur votre machine locale. Allez dans le dossier du backend et lancez :

```bash
cd apps/backend
docker-compose up -d --build
```

- **`-d`** : Lance les services en arrière-plan.
- **`--build`** : Reconstruit l'image si vous avez modifié le code.

### 3. Vérification
- **Backend** : `http://localhost:3000`
- **Base de données** : Accessible via DBeaver sur `localhost:5432` avec les identifiants du `.env`.

---

## 🛣 Endpoints API

### 📍 Calcul et Enregistrement (8 Tables)
**POST** `/api/route`  
Enregistre l'origine, la destination, les coordonnées, la météo et l'analyse de l'IA dans la base de données.
```json
{
  "origin": "Bordeaux",
  "destination": "Paris"
}
```

### 📜 Historique des trajets
**GET** `/api/routes`  
Récupère tous les trajets enregistrés.

---

## 🗄 Base de données (Schéma Relationnel)

Le backend gère désormais une architecture à **8 tables** pour une traçabilité complète :
*   `users` : Profils utilisateurs.
*   `trips` : Entête des trajets.
*   `locations` : Géocodage (Lat/Lng).
*   `optimized_routes` : Résultats des calculs et scores IA.
*   `parkings` & `parking_predictions` : Données stationnement (via IA-Service).
*   `external_data` & `sessions`.

---

## 🐳 Commandes Utiles

| Action | Commande |
| :--- | :--- |
| **Arrêter les services** | `docker-compose down` |
| **Voir les logs en direct** | `docker-compose logs -f` |
| **Réinitialiser la DB** | `docker-compose down -v` (supprime les données) |
| **Entrer dans le conteneur** | `docker exec -it node_backend sh` |

---

**Note** : Assurez-vous que Docker Desktop est lancé avant de démarrer le projet.