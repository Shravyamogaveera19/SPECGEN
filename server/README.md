# SpecGen Server

Express.js + TypeScript backend that powers SpecGen's repository analysis, documentation generation, and diagram creation using AI.

## Features

- 🔍 **GitHub Repository Analysis** - Deep code inspection and validation
- 📝 **AI-Powered Documentation** - Generate SDLC docs using Groq LLM (Llama 3.3 70B)
- 📊 **Diagram Generation** - Create HLD, LLD, Database, and Sequence diagrams
- 💾 **MongoDB Integration** - Store generated documents and validation results
- 🚀 **RESTful API** - Clean API design with comprehensive error handling

## Technology Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **AI/LLM:** Groq SDK (llama-3.3-70b-versatile)
- **External APIs:** GitHub REST API
- **Development:** ts-node-dev (hot reload)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Docker)
- **Groq API Key** (required) - Get free key from [console.groq.com/keys](https://console.groq.com/keys)
- GitHub Token (optional, recommended for higher rate limits)

### Installation

```bash
cd server
npm install
```

### Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Required
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional (recommended for production)
GH_TOKEN=ghp_your_github_personal_access_token

# Database
MONGODB_URI=mongodb://localhost:27017/specgen

# Server
PORT=3000
```

**Getting API Keys:**

1. **Groq API Key (Required):**
   - Visit https://console.groq.com/keys
   - Sign up and create a new API key
   - Free tier includes generous quotas

2. **GitHub Token (Optional):**
   - Visit https://github.com/settings/tokens
   - Generate a classic token with `repo` and `read:org` scopes
   - Increases API rate limit from 60 to 5,000 requests/hour

### Start MongoDB (Docker)

```bash
docker run -d --name specgen-mongo -p 27017:27017 mongo:6
```

### Run Development Server

```bash
npm run dev
# Server starts at http://localhost:3000
```

## API Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### Validate Repository

```http
POST /api/validate-repo
Content-Type: application/json

{
  "url": "https://github.com/owner/repo",
  "branch": "main"  // optional
}
```

**Response:**
```json
{
  "ok": true,
  "exists": true,
  "accessible": true,
  "hasCode": true,
  "owner": "owner",
  "repo": "repo",
  "branch": "main",
  "branches": ["main", "dev"],
  "codeMetrics": {
    "fileCount": 42,
    "languages": ["TypeScript", "JavaScript"],
    "primaryLanguage": "TypeScript",
    "languagePercentages": { "TypeScript": 75.5, "JavaScript": 24.5 },
    "hasTests": true,
    "hasReadme": true,
    "hasCI": true,
    "hasDockerfile": true,
    "configFiles": ["package.json", "tsconfig.json"],
    "qualityScore": 5,
    "projectType": "Web Application (React/Next.js)"
  }
}
```

**Features:**
- Validates GitHub repository URL and accessibility
- Analyzes code structure and language distribution
- Detects frameworks (React, Vue, Express, Django, etc.)
- Identifies project type and architecture
- Checks for tests, CI/CD, Docker, README, License
- Calculates quality score (0-5)

### Generate Documentation

```http
POST /api/generate-docs
Content-Type: application/json

{
  "url": "https://github.com/owner/repo",
  "branch": "main"  // optional
}
```

**Response:**
```json
{
  "ok": true,
  "docs": {
    "requirements": "# Software Requirements Specification\n...",
    "design": "# System Design\n...",
    "testPlan": "# Test Plan\n...",
    "deployment": "# Deployment Guide\n...",
    "analysis": { /* repo analysis */ },
    "repoName": "repo",
    "repoUrl": "https://github.com/owner/repo"
  }
}
```

**Process:**
1. Clones repository to temporary directory (`server/tmp/`)
2. Analyzes code structure, dependencies, frameworks
3. Extracts key code snippets and functions
4. Generates 4 documentation sections in parallel using Groq LLM:
   - **Requirements:** Formal SRS with functional requirements
   - **Design:** Architecture overview, components, tech stack
   - **Test Plan:** Testing strategy and scenarios
   - **Deployment:** Installation, configuration, operations
5. Cleans up temporary files

**AI Model:** Groq Llama 3.3 70B (fast, high-quality)

### Generate Diagrams

```http
POST /api/generate-diagram
Content-Type: application/json

{
  "url": "https://github.com/owner/repo",
  "branch": "main",  // optional
  "diagramType": "hld"  // optional: hld, lld, database, sequence
}
```

**Response:**
```json
{
  "ok": true,
  "diagram": "graph TB\n    User[...]",  // Mermaid syntax
  "diagrams": {
    "hld": "graph TB...",
    "lld": "graph TD...",
    "database": "erDiagram...",
    "sequence": "sequenceDiagram..."
  },
  "codeDetails": {
    "components": [...],
    "services": [...],
    "endpoints": [...],
    "models": [...],
    "routes": [...]
  },
  "analysis": {
    "projectType": "Full-Stack Application",
    "architecture": "Client-Server (MVC/MVVM)",
    "frontendFramework": "React",
    "backendFramework": "Express.js",
    "databaseType": "MongoDB (Mongoose)"
  }
}
```

**Diagram Types:**

1. **HLD (High-Level Design)** - System architecture with layers and data flow
2. **LLD (Low-Level Design)** - Component interactions and detailed flow
3. **Database Schema** - ER diagram with entities and relationships
4. **Sequence Diagram** - Request/response flows and interactions

**Smart Architecture Detection:**
- Detects project type (Full-Stack, Frontend, Backend, CLI, COBOL, Java, etc.)
- Adapts diagram style based on architecture
- Parses actual code to extract components, routes, models, services
- Generates relationships between database entities

## Project Structure

```
server/
├── src/
│   ├── server.ts                 # Main Express app
│   ├── db.ts                     # MongoDB connection
│   ├── controllers/
│   │   ├── validateRepoController.ts    # Repo validation logic
│   │   ├── generateDocsController.ts    # Doc generation with Groq
│   │   └── generateDiagramController.ts # Diagram generation (1700 lines)
│   ├── routes/
│   │   ├── health.ts
│   │   ├── validateRepo.ts
│   │   ├── generateDocs.ts
│   │   └── generateDiagram.ts
│   ├── models/
│   │   ├── ValidationResult.ts
│   │   └── GeneratedDocument.ts
│   └── types/
├── tmp/                          # Temporary repo clones (auto-cleaned)
├── package.json
├── tsconfig.json
└── .env                          # Environment variables
```

## Scripts

```bash
# Development (hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production (run compiled code)
npm start
```

## Development Notes

### Repository Cloning

- Clones repos to `server/tmp/` directory
- Uses `--depth=1` for faster cloning
- Automatically cleans up after processing
- Timeout: 60 seconds

### AI Integration

- Uses Groq SDK with `llama-3.3-70b-versatile` model
- Temperature: 0.7 (balanced creativity/accuracy)
- Max tokens: 2000 per document section
- Parallel generation for faster results

### GitHub API

- Uses REST API v3
- Supports authenticated requests (higher rate limits)
- Falls back to search API when tree API unavailable
- Handles rate limiting gracefully

### Code Analysis

- Detects 30+ programming languages
- Identifies 20+ frameworks (React, Vue, Django, Spring, etc.)
- Extracts functions, classes, methods from code
- Parses model fields from TypeScript, Python, Java, COBOL
- Discovers API endpoints from Express, FastAPI, Flask, Django

## Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "reason": "Error message here"
}
```

Common errors:
- `400` - Invalid request (missing URL, invalid format)
- `403` - GitHub rate limit or access forbidden
- `404` - Repository or branch not found
- `500` - Server error (clone failed, API error, etc.)

## Dependencies

**Core:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `groq-sdk` - Groq LLM client
- `cors` - CORS middleware
- `dotenv` - Environment variables

**Development:**
- `typescript` - Type checking
- `ts-node-dev` - Development server with hot reload
- `@types/*` - TypeScript definitions

## Performance

- **Validation:** < 3 seconds (depends on repo size)
- **Documentation:** 10-20 seconds (4 parallel LLM calls + repo clone)
- **Diagrams:** 5-10 seconds (repo clone + deep analysis)

## Troubleshooting

**Groq API errors:**
- Verify `GROQ_API_KEY` is set correctly
- Check quota at https://console.groq.com
- Free tier is generous but has rate limits

**Git clone timeouts:**
- Increase timeout in controller code
- Check internet connection
- Try with smaller repositories first

**MongoDB connection issues:**
- Ensure MongoDB is running: `docker ps`
- Check `MONGODB_URI` in `.env`
- Default: `mongodb://localhost:27017/specgen`

## License

MIT
