from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

class Texts(BaseModel):
    texts: list[str]

# load a small model by default; change in production
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/embed")
def embed(payload: Texts):
    embeddings = model.encode(payload.texts, show_progress_bar=False)
    # convert to plain lists
    return {"embeddings": [e.tolist() if hasattr(e, 'tolist') else list(e) for e in embeddings]}
