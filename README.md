#  IA Mobility Backend

Backend du projet IA Mobility permettant le calcul d’itinéraires intelligents, l’enregistrement des trajets et la gestion des données.

---

##  Fonctionnalités

- Calcul d’itinéraire avec OpenRouteService
- Géocodage (adresse → coordonnées)
- Enregistrement des requêtes en base PostgreSQL
- Stockage des résultats (distance, durée, géométrie)
- Historique des trajets
- API REST complète

---

##  Technologies utilisées

- Node.js
- Express.js
- PostgreSQL
- Axios
- OpenRouteService API

---

##  Structure du projet

src/
│
├── config/
│ └── db.js
│
├── controllers/
│ └── routeController.js
│
├── routes/
│ └── routeRoutes.js
│
├── services/
│ ├── routeService.js
│ └── geocodeService.js
│
└── server.js


---

##  Installation

### 1. Cloner le projet


git clone <url-du-repo>
cd ia-mobility-backend


### 2. Installer les dépendances

npm install

### 3. Configurer le fichier .env

PORT=5000
ORS_API_KEY=your_api_key

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ia_mobility
DB_USER=postgres
DB_PASSWORD=your_password

## Lancer le serveur

node src/server.js

## Endpoints API 

### Calcul d'un itinéraire

http
POST /api/route

Body (JSON):

{
  "origin": "Paris",
  "destination": "Lyon"
}

### Historique des trajets 

http

GET /api/routes

## Base de données 

Tables principales :

-route_requests

-route_results

## Etat du Projet 

- Backend fonctionnel
- API opérationnelle
- Base de données connectée
- Historique des trajets