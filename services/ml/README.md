# ML Service (FastAPI) — services/ml

This folder contains a minimal FastAPI-based microservice for model inference and embeddings.

Quick start (Python required):

```bash
cd services/ml
python -m venv .venv
source .venv/bin/activate    # windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Endpoints:
- `GET /health` — service health
- `POST /embed` — returns embeddings for provided texts

This example uses `sentence-transformers` for embeddings. For production, use a GPU-backed server or managed embedding service.
