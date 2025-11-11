# SpecGen

SpecGen reverse-engineers an existing codebase to generate SDLC documentation and related artifacts. This repository contains a minimal developer scaffold for the frontend (client), backend (server), and an ML service used for embeddings/inference.

This README explains what the project is and how to navigate and run the three main folders.

---

Folder layout (top-level)

- `client/` — React + TypeScript frontend (Vite). Runs on the dev server (default port 5173).
- `server/` — Node + TypeScript backend (Express). MERN-ready (MongoDB via Mongoose). Runs on port 3000 by default.
- `services/ml/` — Machine Learning microservice (FastAPI + sentence-transformers). Runs on port 8000 by default.

---

Quick start

1. Frontend (client)

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

Notes: the Vite dev server is configured to proxy API calls (e.g. `/api/...`) to the backend during development.

2. Backend (server)

```bash
cd server
npm install
# copy .env.example -> .env and update if needed
cp .env.example .env
# Edit server/.env if you want to change PORT or MONGODB_URI
npm run dev
# Server listens on http://localhost:3000 by default
```

Important: the server expects a MongoDB instance. For local development you can run MongoDB locally or use Docker:

```bash
# Run MongoDB with Docker
docker run -d --name specgen-mongo -p 27017:27017 mongo:6
```

3. ML service (services/ml)

```bash
cd services/ml
python -m venv .venv
# activate the virtualenv
# Windows (PowerShell): .\.venv\Scripts\Activate.ps1
# Git Bash / WSL: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
# Health: http://localhost:8000/health
```

Notes: `services/ml` uses `sentence-transformers` which installs PyTorch. CPU installs can be large and may require platform-specific wheels — see PyTorch installation docs if you hit issues.

---

Environment / ports

- Frontend: default Vite port 5173
- Server: default port 3000 (see `server/.env`) and `server/.env.example`
- ML service: default port 8000

If you want to run everything together, consider a docker-compose setup (not included here yet).

---

If you need help with any of the following I can: add a simple example API route, add Dockerfiles/docker-compose to orchestrate services, wire up CI for tests/linting, or create a minimal README in each folder with more details.