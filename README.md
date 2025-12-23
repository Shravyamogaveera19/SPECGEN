# SpecGen

SpecGen is a full-stack application that analyzes GitHub repositories and automatically generates:

- 📊 **Architecture Diagrams** (HLD, LLD, Database Schema, Sequence Diagrams)
- 📝 **SDLC Documentation** (Requirements, Design, Test Plans, Deployment Guides)
- ✅ **Repository Validation** (Code analysis, language detection, project type identification)

The system uses AI-powered analysis (Groq LLM) combined with deep code inspection to reverse-engineer existing codebases and produce comprehensive technical documentation.

---

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│  React Client   │─────▶│  Express API    │─────▶│  FastAPI Service │
│  (Port 5173)    │      │  (Port 3000)    │      │  (Port 8000)     │
│                 │      │                 │      │                  │
│  • Validation   │      │  • GitHub API   │      │  • Embeddings    │
│  • Diagrams     │      │  • Groq LLM     │      │  • Transformers  │
│  • Docs Display │      │  • MongoDB      │      │                  │
└─────────────────┘      └─────────────────┘      └──────────────────┘
```

---

## Project Structure

- **`client/`** — React + TypeScript frontend with Vite, Tailwind CSS, and Mermaid diagram rendering
- **`server/`** — Express.js backend with TypeScript, MongoDB (Mongoose), and Groq AI integration
- **`services/`** — FastAPI microservice for text embeddings using sentence-transformers

---

## Quick Start

### 1. Backend Server

**Prerequisites:**
- Node.js 18+
- MongoDB instance (local or Docker)
- **Groq API Key** (get free key from [console.groq.com/keys](https://console.groq.com/keys))
- GitHub Token (optional, for higher rate limits)

```bash
cd server
npm install

# Create .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
echo "GH_TOKEN=your_github_token_here" >> .env
echo "MONGODB_URI=mongodb://localhost:27017/specgen" >> .env
echo "PORT=3000" >> .env

# Start MongoDB (Docker)
docker run -d --name specgen-mongo -p 27017:27017 mongo:6

# Run development server
npm run dev
```

**Server Endpoints:**
- `GET /api/health` - Health check
- `POST /api/validate-repo` - Validate and analyze GitHub repository
- `POST /api/generate-docs` - Generate SDLC documentation (SRS, Design, Test Plan, Deployment)
- `POST /api/generate-diagram` - Generate architecture diagrams (HLD, LLD, Database, Sequence)

### 2. Frontend Client

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3000`.

**Features:**
- Repository validation with detailed code analysis
- Interactive Mermaid diagram viewer with zoom/pan controls
- Export diagrams as PNG, PDF, or SVG
- Documentation viewer with syntax highlighting
- Multi-page SPA with React Router

### 3. ML Service (Optional)

The embeddings service is currently optional as the main functionality uses Groq API.

```bash
cd services
python -m venv .venv

# Activate virtualenv
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Git Bash/Linux: source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**Endpoints:**
- `GET /health` - Service health check
- `POST /embed` - Generate embeddings for text (uses all-MiniLM-L6-v2)

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for LLM-based documentation generation |
| `GH_TOKEN` | ⚠️ Optional | GitHub personal access token (increases API rate limits) |
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `PORT` | ⚠️ Optional | Server port (default: 3000) |

---

## Key Features

### Repository Validation
- Parses GitHub URLs and validates repository accessibility
- Detects programming languages and frameworks
- Identifies project type (Full-Stack, Frontend, Backend, CLI, etc.)
- Analyzes code structure, test coverage, CI/CD, Docker support
- Calculates quality score based on best practices

### Documentation Generation
- **SRS (Software Requirements Specification)** - Formal requirements document
- **System Design** - Architecture overview and component breakdown
- **Test Plan** - Testing strategy and scenarios
- **Deployment Guide** - Installation, configuration, and operations

Generated using Groq's Llama 3.3 70B model with repository context.

### Diagram Generation
- **High-Level Design (HLD)** - System architecture overview
- **Low-Level Design (LLD)** - Component interactions and flow
- **Database Schema** - ER diagrams with relationships
- **Sequence Diagrams** - Request/response flows

Supports various architectures: Full-Stack, Microservices, COBOL, Java, Python, C++/Rust/Go utilities.

---

## Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7 (build tool)
- Tailwind CSS 4
- React Router 6
- Mermaid.js (diagram rendering)
- html2canvas, jsPDF (export)

**Backend:**
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Groq SDK (llama-3.3-70b-versatile)
- GitHub REST API

**ML Service:**
- FastAPI + Python
- sentence-transformers
- PyTorch

---

## Development

```bash
# Run all services (3 terminals)

# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev

# Terminal 3 - ML Service (optional)
cd services && uvicorn app:app --reload
```

---

## Build for Production

```bash
# Client
cd client
npm run build  # Output: client/dist/

# Server
cd server
npm run build  # Output: server/dist/
npm start      # Run compiled server
```

---

## Troubleshooting

**"GROQ_API_KEY not configured"**
- Get a free API key from https://console.groq.com/keys
- Add to `server/.env`: `GROQ_API_KEY=gsk_...`

**GitHub rate limit exceeded**
- Create a GitHub personal access token
- Add to `server/.env`: `GH_TOKEN=ghp_...`

**MongoDB connection failed**
- Ensure MongoDB is running: `docker ps`
- Check connection string in `MONGODB_URI`

---

## License

MIT