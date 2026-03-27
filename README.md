# 🗺️ IA Mobility — Guide de démarrage

Application de navigation intelligente pour Bordeaux Métropole, avec suggestions d'itinéraires, météo, trafic et prédiction de parkings.

---

## 📋 Prérequis

Installez ces outils **avant** de cloner le projet :

| Outil | Version | Lien |
|---|---|---|
| **Git** | n'importe laquelle | [git-scm.com](https://git-scm.com/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Docker Desktop** | n'importe laquelle | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **Python** | 3.10+ | [python.org](https://www.python.org/) |

> **Windows** : Utilisez **PowerShell** ou le **Windows Terminal**. Toutes les commandes ci-dessous fonctionnent tels quels. Docker Desktop doit être ouvert et en cours d'exécution avant de lancer les commandes Docker.

---

## 1. Cloner le projet

```bash
git clone https://github.com/OLP21/IA_Mobility.git
cd IA_Mobility
```

Ensuite, basculez sur la branche principale de développement :

```bash
git checkout Teddy
```

---

## 2. Configurer le fichier `.env`

Le backend nécessite un fichier `.env` dans `apps/backend/`.  
Créez-le en copiant le template ci-dessous :

**Mac/Linux :**
```bash
cp apps/backend/.env.example apps/backend/.env
```

**Windows (PowerShell) :**
```powershell
Copy-Item apps\backend\.env.example apps\backend\.env
```

> ⚠️ Si le fichier `.env.example` n'existe pas, créez `apps/backend/.env` manuellement avec ce contenu :

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=ia_mobility
DB_USER=teddy
DB_PASSWORD=ton_password

ORS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijg0MWUxMzBlOTEwYjQ2MmU5ZDc1MWRjZWMxZWQ4OWZjIiwiaCI6Im11cm11cjY0In0=
WEATHER_API_KEY=c72be3419f3fac81e7978aa1378cf098
HERE_API_KEY=np9YC_rjD4mQxPMSlE5BC9ajacWJvKTrnVJByunx-Bk

SESSION_SECRET=une_chaine_aleatoire_longue_et_secrete

PORT=3000
```

---

## 3. Installer les dépendances Node.js

À la **racine** du projet :

```bash
npm install
```

---

## 4. Lancer le Backend + Base de données (Docker)

```bash
cd apps/backend
docker-compose up --build
```

> La première fois, Docker va télécharger les images et créer la base de données automatiquement. Cela peut prendre 1 à 2 minutes.  
> Les fois suivantes, `docker-compose up` suffit (sans `--build`).

✅ Le backend est prêt quand vous voyez : `Server running on port 3000`

**Vérification :** Ouvrez [http://localhost:3000](http://localhost:3000) — vous devriez voir `{"message":"IA Mobility backend running + Auth running"}`

---

## 5. Lancer le service IA (Python)

Ouvrez un **nouveau terminal** et exécutez :

**Mac/Linux :**
```bash
cd apps/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

**Windows (PowerShell) :**
```powershell
cd apps\ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

> Si PowerShell refuse l'activation du venv (erreur de politique d'exécution), lancez d'abord :
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

✅ Le service IA est prêt quand vous voyez : `Running on http://0.0.0.0:5001`

---

## 6. Lancer le Frontend

Ouvrez un **nouveau terminal** à la **racine** du projet :

```bash
npm run dev -w @ia-mobility/frontend
```

✅ Le frontend est prêt quand vous voyez : `Local: http://localhost:5173/`

**Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.**

---

## 🌐 Ports utilisés

| Service | URL | Description |
|---|---|---|
| Frontend | [http://localhost:5173](http://localhost:5173) | Interface utilisateur |
| Backend API | [http://localhost:3000](http://localhost:3000) | API Node.js |
| Service IA | [http://localhost:5001](http://localhost:5001) | Prédiction parking (Python) |
| PostgreSQL | `localhost:5432` | Base de données (Docker) |

---

## 🗂️ Structure du projet

```
IA_Mobility/
├── apps/
│   ├── frontend/        # React + Vite + TypeScript + Leaflet
│   ├── backend/         # Node.js + Express + PostgreSQL (Docker)
│   │   ├── docker-compose.yml
│   │   ├── .env         # ← à créer (voir étape 2)
│   │   └── database/    # Schéma SQL (auto-injecté au 1er démarrage)
│   └── ai-service/      # Python Flask + Random Forest (prédiction parking)
├── packages/            # Packages partagés (monorepo)
└── package.json         # Config monorepo npm workspaces
```

---

## ❓ Problèmes fréquents

**Docker ne démarre pas**
→ Vérifiez que Docker Desktop est ouvert et running (icône baleine dans la barre des tâches).

**Erreur `port already in use`**
→ Un service tourne déjà sur ce port. Arrêtez-le ou changez le port dans `.env`.

**Windows : `python3` introuvable**
→ Sur Windows, la commande est `python` (sans le `3`). Vérifiez avec `python --version`.

**Erreur de connexion à la base de données**
→ Attendez quelques secondes que PostgreSQL soit complètement démarré avant que le backend ne se connecte. Docker gère ça automatiquement avec `depends_on`.

**Le frontend affiche une carte vide**
→ Vérifiez que le backend tourne bien sur le port 3000 (étape 4).
