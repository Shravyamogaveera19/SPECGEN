# SpecGen ML Service

FastAPI microservice for generating text embeddings using sentence-transformers. This service provides semantic text representation for potential future features like code similarity search, documentation search, or intelligent code analysis.

## Features

- 🚀 **Fast API** - Async Python web framework
- 🤖 **Sentence Transformers** - State-of-the-art text embeddings
- 📊 **Model:** all-MiniLM-L6-v2 (384-dimensional embeddings)
- ⚡ **Lightweight** - CPU-friendly model for quick inference
- 🔧 **Simple API** - RESTful endpoints with JSON

## Technology Stack

- **Framework:** FastAPI
- **ML Library:** sentence-transformers
- **Deep Learning:** PyTorch
- **Server:** Uvicorn (ASGI)

## Setup

### Prerequisites

- Python 3.8+
- 2GB+ RAM (for model loading)

### Installation

```bash
cd services
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Windows (Command Prompt):
.venv\Scripts\activate.bat

# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note:** First installation downloads the model (~80MB) and PyTorch dependencies (~500MB for CPU version).

### Run Development Server

```bash
uvicorn app:app --reload --port 8000
```

**Or with custom host:**

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Server starts at http://localhost:8000

**API Documentation:** http://localhost:8000/docs (auto-generated Swagger UI)

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "model": "all-MiniLM-L6-v2"
}
```

### Generate Embeddings

```http
POST /embed
Content-Type: application/json

{
  "texts": [
    "This is the first text to embed",
    "This is the second text"
  ]
}
```

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, 0.789, ...],  // 384-dimensional vector
    [0.234, -0.567, 0.890, ...]   // 384-dimensional vector
  ]
}
```

**Features:**
- Accepts multiple texts in a single request
- Returns dense vector representations (384 dimensions)
- Fast inference (CPU-optimized)
- No progress bars in production

## Project Structure

```
services/
├── app.py                # FastAPI application
├── requirements.txt      # Python dependencies
├── .venv/               # Virtual environment (created locally)
└── README.md
```

## Code Overview

### app.py

```python
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

class Texts(BaseModel):
    texts: list[str]

# Load model on startup
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/embed")
def embed(payload: Texts):
    embeddings = model.encode(payload.texts, show_progress_bar=False)
    return {
        "embeddings": [
            e.tolist() if hasattr(e, 'tolist') else list(e) 
            for e in embeddings
        ]
    }
```

## Model Information

### all-MiniLM-L6-v2

- **Type:** Sentence Transformer
- **Base Model:** Microsoft MiniLM
- **Dimensions:** 384
- **Max Sequence Length:** 256 tokens
- **Performance:** Fast, lightweight, CPU-friendly
- **Use Cases:**
  - Semantic search
  - Text similarity
  - Clustering
  - Information retrieval

**Performance Benchmarks:**
- ~500 sentences/second (CPU)
- ~2000 sentences/second (GPU)

## Dependencies

```
fastapi==0.100.0          # Web framework
uvicorn[standard]==0.22.0 # ASGI server
sentence-transformers==2.2.2  # Embedding models
transformers==4.35.2      # Hugging Face transformers
torch==2.2.0              # PyTorch (CPU version)
numpy                     # Numerical operations
python-multipart          # Form data parsing
pydantic                  # Data validation
```

## Usage Examples

### Python Client

```python
import requests

# Generate embeddings
response = requests.post(
    "http://localhost:8000/embed",
    json={
        "texts": [
            "FastAPI is a modern web framework",
            "Python is great for ML"
        ]
    }
)

embeddings = response.json()["embeddings"]
print(f"Embedding dimension: {len(embeddings[0])}")  # 384
```

### cURL

```bash
# Health check
curl http://localhost:8000/health

# Generate embeddings
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Hello world", "FastAPI is awesome"]}'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8000/embed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    texts: ['Text 1', 'Text 2']
  })
});

const { embeddings } = await response.json();
console.log('Embeddings:', embeddings);
```

## Production Deployment

### Docker (Recommended)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t specgen-ml .
docker run -p 8000:8000 specgen-ml
```

### Production Server

```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn (multi-worker)
gunicorn app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### GPU Acceleration

For better performance with GPU:

1. Install PyTorch with CUDA:
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cu118
   ```

2. Model automatically uses GPU if available:
   ```python
   model = SentenceTransformer(MODEL_NAME)
   # Automatically moves to CUDA if available
   ```

## Integration with SpecGen

This service is **currently optional** as the main SpecGen application uses Groq API for documentation generation. Future features may include:

- **Code Similarity Search** - Find similar code patterns
- **Semantic Documentation Search** - Search docs by meaning
- **Intelligent Code Analysis** - Cluster related functions
- **Repository Comparison** - Compare codebases semantically

## Performance

**CPU (Intel i7):**
- Single text: ~10ms
- Batch of 10: ~50ms
- Batch of 100: ~400ms

**GPU (NVIDIA T4):**
- Single text: ~5ms
- Batch of 10: ~15ms
- Batch of 100: ~80ms

**Memory Usage:**
- Model: ~120MB
- Python runtime: ~100MB
- Peak: ~250MB

## Troubleshooting

**Model download fails:**
- Check internet connection
- Model downloads from Hugging Face Hub
- Stored in `~/.cache/huggingface/`

**PyTorch installation issues:**
- Use CPU version for simplicity
- For GPU: Install CUDA-compatible PyTorch
- See: https://pytorch.org/get-started/locally/

**Port 8000 already in use:**
```bash
# Use different port
uvicorn app:app --reload --port 8001
```

**Out of memory:**
- Reduce batch size in client code
- Use smaller model (but less accurate)
- Add pagination for large requests

## Alternative Models

You can change the model by editing `app.py`:

```python
# Smaller, faster (96 dimensions)
MODEL_NAME = "paraphrase-MiniLM-L3-v2"

# Larger, more accurate (768 dimensions)
MODEL_NAME = "all-mpnet-base-v2"

# Multilingual
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
```

## API Documentation

FastAPI automatically generates interactive API docs:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## License

MIT
