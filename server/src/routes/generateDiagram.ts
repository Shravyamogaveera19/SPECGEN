import { Router } from 'express';

// Generate architecture diagrams for a given repository
// POST /api/generate-diagram  body: { owner, repo, branch, diagramType }

const router = Router();

router.post('/', async (req, res) => {
  const { owner, repo, branch, diagramType } = req.body;

  if (!owner || !repo || !diagramType) {
    return res.status(400).json({ 
      ok: false, 
      reason: 'Missing required fields: owner, repo, diagramType' 
    });
  }

  try {
    // Fetch repository structure
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch || 'main'}?recursive=1`;
    const treeResp = await ghGet(treeUrl);
    
    if (treeResp.status !== 200) {
      return res.status(404).json({ 
        ok: false, 
        reason: 'Failed to fetch repository structure' 
      });
    }

    const treeData = await treeResp.json();
    const files = treeData.tree || [];

    // Analyze repository structure
    const analysis = await analyzeRepositoryStructure(files, owner, repo, branch);

    // Generate diagram based on type
    let diagramContent = '';
    
    switch (diagramType) {
      case 'hld':
        diagramContent = generateHLD(analysis);
        break;
      case 'lld':
        diagramContent = generateLLD(analysis);
        break;
      case 'database':
        diagramContent = generateDatabaseSchema(analysis);
        break;
      case 'sequence':
        diagramContent = generateSequenceDiagram(analysis);
        break;
      default:
        return res.status(400).json({ 
          ok: false, 
          reason: 'Invalid diagram type' 
        });
    }

    return res.json({
      ok: true,
      diagram: diagramContent,
      diagramType,
      repository: `${owner}/${repo}`,
      branch: branch || 'main',
    });

  } catch (err: any) {
    console.error('Error generating diagram:', err);
    return res.status(500).json({ 
      ok: false, 
      reason: 'Internal error generating diagram' 
    });
  }
});

// Helper: Analyze repository structure
async function analyzeRepositoryStructure(files: any[], owner: string, repo: string, branch: string) {
  const structure: any = {
    frontend: [],
    backend: [],
    database: [],
    config: [],
    routes: [],
    models: [],
    services: [],
    components: [],
    languages: new Set<string>(),
    hasDocker: false,
    hasDatabase: false,
    hasAPI: false,
    hasFrontend: false,
    hasBackend: false,
  };

  for (const file of files) {
    const path = file.path.toLowerCase();
    const ext = path.split('.').pop();

    // Detect languages
    if (ext) structure.languages.add(ext);

    // Frontend detection
    if (path.includes('client/') || path.includes('frontend/') || 
        path.includes('src/components/') || path.includes('pages/')) {
      structure.hasFrontend = true;
      structure.frontend.push(file.path);
    }

    // Backend detection
    if (path.includes('server/') || path.includes('backend/') || 
        path.includes('api/') || path.includes('routes/')) {
      structure.hasBackend = true;
      structure.backend.push(file.path);
    }

    // Routes
    if (path.includes('route') || path.includes('controller')) {
      structure.routes.push(file.path);
      structure.hasAPI = true;
    }

    // Models/Schema
    if (path.includes('model') || path.includes('schema') || path.includes('entity')) {
      structure.models.push(file.path);
      structure.hasDatabase = true;
    }

    // Database files
    if (path.includes('.sql') || path.includes('migration') || path.includes('prisma')) {
      structure.database.push(file.path);
      structure.hasDatabase = true;
    }

    // Services
    if (path.includes('service') || path.includes('provider')) {
      structure.services.push(file.path);
    }

    // Components
    if (path.includes('component') && (path.endsWith('.tsx') || path.endsWith('.jsx'))) {
      structure.components.push(file.path);
    }

    // Docker
    if (path.includes('dockerfile') || path.includes('docker-compose')) {
      structure.hasDocker = true;
    }

    // Config
    if (path.includes('.json') || path.includes('.yml') || path.includes('.yaml') || path.includes('.config')) {
      structure.config.push(file.path);
    }
  }

  structure.languages = Array.from(structure.languages);
  return structure;
}

// Generate High-Level Design (HLD)
function generateHLD(analysis: any): string {
  let diagram = `graph TB\n`;

  // Add frontend if exists
  if (analysis.hasFrontend) {
    diagram += `    Frontend["Frontend Layer"]\n`;
  }

  // Add backend if exists
  if (analysis.hasBackend) {
    diagram += `    Backend["Backend/API Layer"]\n`;
  }

  // Add database if exists
  if (analysis.hasDatabase) {
    diagram += `    Database["Database Layer"]\n`;
  }

  // Add connections
  if (analysis.hasFrontend && analysis.hasBackend) {
    diagram += `    Frontend -->|HTTP/REST| Backend\n`;
  }

  if (analysis.hasBackend && analysis.hasDatabase) {
    diagram += `    Backend -->|Query/Store| Database\n`;
  }

  // Add external services if Docker exists
  if (analysis.hasDocker) {
    diagram += `    Docker["Docker Container"]\n`;
    if (analysis.hasBackend) {
      diagram += `    Backend --> Docker\n`;
    }
  }

  // Styling
  diagram += `\n    style Frontend fill:#1e40af,stroke:#0c4a6e,stroke-width:2px,color:#fff\n`;
  diagram += `    style Backend fill:#16a34a,stroke:#15803d,stroke-width:2px,color:#fff\n`;
  diagram += `    style Database fill:#9333ea,stroke:#7c3aed,stroke-width:2px,color:#fff\n`;

  return diagram;
}

// Generate Low-Level Design (LLD)
function generateLLD(analysis: any): string {
  let diagram = `graph TD\n`;

  // Routes/Controllers
  if (analysis.routes.length > 0) {
    diagram += `    Routes["API Routes"]\n`;
    diagram += `    Controllers["Controllers"]\n`;
    diagram += `    Routes --> Controllers\n`;
  }

  // Services
  if (analysis.services.length > 0) {
    diagram += `    Services["Business Logic"]\n`;
    if (analysis.routes.length > 0) {
      diagram += `    Controllers --> Services\n`;
    }
  }

  // Models
  if (analysis.models.length > 0) {
    diagram += `    Models["Data Models"]\n`;
    if (analysis.services.length > 0) {
      diagram += `    Services --> Models\n`;
    } else if (analysis.routes.length > 0) {
      diagram += `    Controllers --> Models\n`;
    }
  }

  // Components (Frontend)
  if (analysis.components.length > 0) {
    diagram += `    Components["UI Components"]\n`;
    diagram += `    Components -->|API Calls| Routes\n`;
  }

  return diagram;
}

// Generate Database Schema
function generateDatabaseSchema(analysis: any): string {
  if (!analysis.hasDatabase) {
    return `graph LR\n    NoDB["No database schema detected"]\n    style NoDB fill:#ef4444,color:#fff`;
  }

  let diagram = `erDiagram\n`;

  // Infer entities from model files
  const entities = analysis.models
    .map((path: string) => {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      return fileName.replace(/\.(js|ts|py|java)/, '').toUpperCase();
    })
    .slice(0, 5); // Limit to 5 entities

  // Create basic relationships
  for (let i = 0; i < entities.length; i++) {
    diagram += `    ${entities[i]} {\n`;
    diagram += `        string id PK\n`;
    diagram += `        string name\n`;
    diagram += `        datetime createdAt\n`;
    diagram += `    }\n`;
  }

  // Add relationships between first few entities
  if (entities.length >= 2) {
    diagram += `    ${entities[0]} ||--o{ ${entities[1]} : contains\n`;
  }

  return diagram;
}

// Generate Sequence Diagram
function generateSequenceDiagram(analysis: any): string {
  let diagram = `sequenceDiagram\n`;
  diagram += `    participant User\n`;
  
  if (analysis.hasFrontend) {
    diagram += `    participant Frontend\n`;
  }
  
  if (analysis.hasBackend) {
    diagram += `    participant Backend\n`;
  }
  
  if (analysis.hasDatabase) {
    diagram += `    participant Database\n`;
  }

  // Add basic flow
  diagram += `\n    User->>Frontend: Opens application\n`;
  
  if (analysis.hasFrontend && analysis.hasBackend) {
    diagram += `    Frontend->>Backend: API Request\n`;
  }
  
  if (analysis.hasBackend && analysis.hasDatabase) {
    diagram += `    Backend->>Database: Query data\n`;
    diagram += `    Database-->>Backend: Return results\n`;
  }
  
  if (analysis.hasBackend && analysis.hasFrontend) {
    diagram += `    Backend-->>Frontend: Response\n`;
  }
  
  diagram += `    Frontend-->>User: Display data\n`;

  return diagram;
}

// Helper: GitHub API fetch
async function ghGet(url: string) {
  return fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'SpecGen',
    },
  });
}

export default router;
