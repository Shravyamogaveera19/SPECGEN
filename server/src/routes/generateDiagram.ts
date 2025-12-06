import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Generate advanced architecture diagrams for a given repository
// POST /api/generate-diagram  body: { url, branch }

const router = Router();

router.post('/', async (req, res) => {
  let { url, branch, owner, repo, diagramType } = req.body;

  // Support both formats: {url, branch} or {owner, repo, branch}
  if (!url && owner && repo) {
    url = `https://github.com/${owner}/${repo}`;
  }

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ 
      ok: false, 
      reason: 'Missing or invalid url field (provide either url or owner+repo)' 
    });
  }

  const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
  const tmpDir = path.join(__dirname, '../../tmp');
  const tempDir = path.join(tmpDir, `${repoName}-${Date.now()}`);

  try {
    // Ensure tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Create temp directory for this clone
    fs.mkdirSync(tempDir, { recursive: true });

    // Clone repository
    const branchFlag = branch ? `-b ${branch}` : '';
    console.log(`Cloning repository for diagram analysis: ${url}`);
    
    try {
      await execAsync(`git clone --depth=1 ${branchFlag} ${url} ${tempDir}`, { 
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10
      });
    } catch (gitErr: any) {
      console.error('Git clone failed:', gitErr.message);
      throw new Error(`Failed to clone repository: ${gitErr.message}`);
    }

    // Deep analyze repository
    const analysis = await deepAnalyzeRepository(tempDir, repoName);

    // Generate all 4 advanced diagrams
    const diagrams = {
      hld: generateAdvancedHLD(analysis),
      lld: generateAdvancedLLD(analysis),
      database: generateAdvancedDatabaseSchema(analysis),
      sequence: generateAdvancedSequenceDiagram(analysis),
    };

    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Return specific diagram or all diagrams
    const selectedDiagram = diagramType && diagrams[diagramType as keyof typeof diagrams] 
      ? diagrams[diagramType as keyof typeof diagrams]
      : diagrams.hld;

    res.json({
      ok: true,
      diagram: selectedDiagram,
      diagrams,
      codeDetails: {
        // Frontend components with real functions, imports, and line counts
        components: analysis.frontend.components.map((c: any) => ({
          name: c.name,
          path: c.path,
          type: c.type,
          functions: c.functions || [],
          imports: c.imports || [],
          lineCount: c.lineCount || 0,
          hasHooks: c.hasHooks || false,
          hasProps: c.hasProps || false,
        })),
        // Backend services with methods and details
        services: analysis.backend.services.map((s: any) => ({
          name: s.name,
          path: s.path,
          methods: s.methods || [],
          lineCount: s.lineCount || 0,
          isClass: s.isClass || false,
        })),
        // API endpoints with methods and paths
        endpoints: analysis.apiEndpoints.map((e: any) => ({
          method: e.method,
          path: e.path,
          file: e.file,
        })).slice(0, 20), // Top 20 endpoints
        // Database models with fields
        models: analysis.database.models.map((m: any) => ({
          name: m.name,
          path: m.path,
          fields: m.fields || [],
          lineCount: m.lineCount || 0,
          hasValidation: m.hasValidation || false,
        })),
        // Route handlers
        routes: analysis.backend.routes.map((r: any) => ({
          name: r.name,
          path: r.path,
          endpoints: r.endpoints || [],
          handlers: r.handlers || [],
          lineCount: r.lineCount || 0,
        })),
      },
      analysis: {
        projectType: analysis.projectType,
        architecture: analysis.architecture,
        totalFiles: analysis.totalFiles,
        apiEndpoints: analysis.apiEndpoints?.length || 0,
        components: analysis.components.length,
        models: analysis.models.length,
        services: analysis.backend.services.length,
        routes: analysis.backend.routes.length,
        frontendFramework: analysis.frontend.framework,
        backendFramework: analysis.backend.framework,
        databaseType: analysis.database.type,
        stateManagement: analysis.frontend.stateManagement,
        languages: analysis.languages,
      },
    });

  } catch (err: any) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.error('Error generating diagrams:', err.message || err);
    res.status(500).json({ 
      ok: false, 
      reason: err.message || 'Failed to generate diagrams' 
    });
  }
});

// Deep analyze repository structure with actual file parsing
async function deepAnalyzeRepository(repoPath: string, repoName: string) {
  const analysis: any = {
    repoName,
    projectType: 'Unknown',
    architecture: 'Unknown',
    totalFiles: 0,
    frontend: {
      framework: null,
      components: [],
      pages: [],
      services: [],
      stateManagement: null,
    },
    backend: {
      framework: null,
      routes: [],
      controllers: [],
      middleware: [],
      services: [],
    },
    database: {
      type: null,
      models: [],
      migrations: [],
      schemas: [],
    },
    apiEndpoints: [],
    components: [],
    models: [],
    routes: [],
    services: [],
    middlewares: [],
    utilities: [],
    config: [],
    tests: [],
    docker: false,
    ci: false,
    languages: new Set<string>(),
    dependencies: [],
    devDependencies: [],
  };

  // Recursively scan directory
  const scanDir = (dir: string, baseDir: string = dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      // Skip node_modules, .git, dist, build
      if (entry.name === 'node_modules' || entry.name === '.git' || 
          entry.name === 'dist' || entry.name === 'build' || 
          entry.name === '.next') {
        continue;
      }

      if (entry.isDirectory()) {
        scanDir(fullPath, baseDir);
      } else {
        analysis.totalFiles++;
        const ext = path.extname(entry.name);
        const lowerPath = relativePath.toLowerCase();
        const fileName = entry.name.toLowerCase();

        // Track languages
        if (ext) analysis.languages.add(ext.slice(1));

        // Detect project type and frameworks
        if (fileName === 'package.json') {
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            analysis.dependencies = Object.keys(pkg.dependencies || {});
            analysis.devDependencies = Object.keys(pkg.devDependencies || {});

            // Detect frontend frameworks
            if (pkg.dependencies?.react || pkg.devDependencies?.react) {
              analysis.frontend.framework = 'React';
            }
            if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
              analysis.frontend.framework = 'Vue';
            }
            if (pkg.dependencies?.['@angular/core']) {
              analysis.frontend.framework = 'Angular';
            }
            if (pkg.dependencies?.next) {
              analysis.frontend.framework = 'Next.js';
              analysis.projectType = 'Full-Stack (Next.js)';
            }

            // Detect backend frameworks
            if (pkg.dependencies?.express) {
              analysis.backend.framework = 'Express.js';
            }
            if (pkg.dependencies?.fastify) {
              analysis.backend.framework = 'Fastify';
            }
            if (pkg.dependencies?.koa) {
              analysis.backend.framework = 'Koa';
            }
            if (pkg.dependencies?.nestjs || pkg.dependencies?.['@nestjs/core']) {
              analysis.backend.framework = 'NestJS';
            }

            // Detect databases
            if (pkg.dependencies?.mongoose) {
              analysis.database.type = 'MongoDB (Mongoose)';
            }
            if (pkg.dependencies?.pg || pkg.dependencies?.postgres) {
              analysis.database.type = 'PostgreSQL';
            }
            if (pkg.dependencies?.mysql || pkg.dependencies?.mysql2) {
              analysis.database.type = 'MySQL';
            }
            if (pkg.dependencies?.prisma || pkg.devDependencies?.prisma) {
              analysis.database.type = 'Prisma ORM';
            }
            if (pkg.dependencies?.sequelize) {
              analysis.database.type = 'Sequelize ORM';
            }

            // Detect state management
            if (pkg.dependencies?.redux || pkg.dependencies?.['@reduxjs/toolkit']) {
              analysis.frontend.stateManagement = 'Redux';
            }
            if (pkg.dependencies?.zustand) {
              analysis.frontend.stateManagement = 'Zustand';
            }
            if (pkg.dependencies?.mobx) {
              analysis.frontend.stateManagement = 'MobX';
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Detect requirements.txt (Python)
        if (fileName === 'requirements.txt') {
          analysis.projectType = 'Python Application';
          try {
            const requirements = fs.readFileSync(fullPath, 'utf-8');
            if (requirements.includes('django')) {
              analysis.backend.framework = 'Django';
            }
            if (requirements.includes('flask')) {
              analysis.backend.framework = 'Flask';
            }
            if (requirements.includes('fastapi')) {
              analysis.backend.framework = 'FastAPI';
            }
          } catch (e) {}
        }

        // Detect pom.xml (Java/Maven)
        if (fileName === 'pom.xml') {
          analysis.projectType = 'Java Application (Maven)';
          analysis.backend.framework = 'Spring Boot (likely)';
        }

        // Frontend components
        if ((lowerPath.includes('component') || lowerPath.includes('/src/pages/')) && 
            (ext === '.tsx' || ext === '.jsx' || ext === '.vue')) {
          analysis.frontend.components.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
            type: lowerPath.includes('/pages/') ? 'Page' : 'Component',
          });
          analysis.components.push(relativePath);
        }

        // Backend routes
        if ((lowerPath.includes('route') || lowerPath.includes('controller')) && 
            (ext === '.ts' || ext === '.js' || ext === '.py' || ext === '.java')) {
          analysis.backend.routes.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.routes.push(relativePath);
          
          // Try to parse API endpoints
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const endpoints = extractAPIEndpoints(content, entry.name);
            analysis.apiEndpoints.push(...endpoints);
          } catch (e) {}
        }

        // Models/Schemas
        if ((lowerPath.includes('model') || lowerPath.includes('schema') || lowerPath.includes('entity')) && 
            (ext === '.ts' || ext === '.js' || ext === '.py' || ext === '.java')) {
          analysis.database.models.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.models.push(relativePath);
        }

        // Services
        if (lowerPath.includes('service') && 
            (ext === '.ts' || ext === '.js' || ext === '.py')) {
          analysis.backend.services.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.services.push(relativePath);
        }

        // Middleware
        if (lowerPath.includes('middleware') && 
            (ext === '.ts' || ext === '.js')) {
          analysis.backend.middleware.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.middlewares.push(relativePath);
        }

        // Database migrations
        if (lowerPath.includes('migration') || lowerPath.includes('migrate')) {
          analysis.database.migrations.push(relativePath);
        }

        // Docker
        if (fileName.includes('dockerfile') || fileName === 'docker-compose.yml') {
          analysis.docker = true;
        }

        // CI/CD
        if (lowerPath.includes('.github/workflows') || fileName === '.gitlab-ci.yml' || 
            fileName === 'jenkinsfile') {
          analysis.ci = true;
        }

        // Tests
        if (lowerPath.includes('test') || lowerPath.includes('spec') || 
            fileName.includes('.test.') || fileName.includes('.spec.')) {
          analysis.tests.push(relativePath);
        }

        // Config files
        if (ext === '.json' || ext === '.yml' || ext === '.yaml' || 
            fileName.includes('config') || fileName === '.env.example') {
          analysis.config.push(relativePath);
        }

        // Utilities
        if (lowerPath.includes('util') || lowerPath.includes('helper') || 
            lowerPath.includes('lib')) {
          analysis.utilities.push(relativePath);
        }
      }
    }
  };

  scanDir(repoPath);

  // Determine project type
  if (analysis.frontend.framework && analysis.backend.framework) {
    analysis.projectType = 'Full-Stack Application';
    analysis.architecture = 'Client-Server (MVC/MVVM)';
  } else if (analysis.frontend.framework) {
    analysis.projectType = 'Frontend Application';
    analysis.architecture = 'Component-Based (SPA)';
  } else if (analysis.backend.framework) {
    analysis.projectType = 'Backend/API Application';
    analysis.architecture = 'RESTful API / Microservice';
  }

  analysis.languages = Array.from(analysis.languages);
  
  // Enrich analysis with code details
  const enrichedAnalysis = enrichAnalysisWithCodeDetails(repoPath, analysis);
  
  return enrichedAnalysis;
}

// Enrich analysis with actual code details from files
function enrichAnalysisWithCodeDetails(repoPath: string, analysis: any): any {
  // Extract component details (functions, exports)
  analysis.frontend.components = analysis.frontend.components.map((comp: any) => {
    const fullPath = path.join(repoPath, comp.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const functions = extractFunctionsFromCode(content);
      const imports = extractImportsFromCode(content);
      return {
        ...comp,
        functions: functions.slice(0, 5), // Top 5 functions
        imports: imports.slice(0, 5),
        lineCount: content.split('\n').length,
        hasHooks: content.includes('useState') || content.includes('useEffect'),
        hasProps: content.includes('props') || content.includes('interface Props'),
      };
    } catch (e) {
      return comp;
    }
  });

  // Extract service details
  analysis.backend.services = analysis.backend.services.map((service: any) => {
    const fullPath = path.join(repoPath, service.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const functions = extractFunctionsFromCode(content);
      const methods = extractClassMethods(content);
      return {
        ...service,
        methods: (methods.length > 0 ? methods : functions).slice(0, 8),
        lineCount: content.split('\n').length,
        isClass: content.includes('class ') || content.includes('export class'),
      };
    } catch (e) {
      return service;
    }
  });

  // Extract model details
  analysis.database.models = analysis.database.models.map((model: any) => {
    const fullPath = path.join(repoPath, model.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fields = extractModelFields(content);
      return {
        ...model,
        fields: fields.slice(0, 10),
        lineCount: content.split('\n').length,
        hasValidation: content.includes('validate') || content.includes('@Validate'),
      };
    } catch (e) {
      return model;
    }
  });

  // Extract route handler details
  analysis.backend.routes = analysis.backend.routes.map((route: any) => {
    const fullPath = path.join(repoPath, route.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const endpoints = extractAPIEndpoints(content, route.name);
      const functions = extractFunctionsFromCode(content);
      return {
        ...route,
        endpoints: endpoints,
        handlers: functions.slice(0, 5),
        lineCount: content.split('\n').length,
      };
    } catch (e) {
      return route;
    }
  });

  return analysis;
}

// Extract function names from code
function extractFunctionsFromCode(content: string): string[] {
  const functions: string[] = [];
  
  // JavaScript/TypeScript functions
  const funcPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  let match;
  while ((match = funcPattern.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (name && !functions.includes(name)) {
      functions.push(name);
    }
  }

  // Python functions
  const pyFuncPattern = /def\s+(\w+)\s*\(/g;
  while ((match = pyFuncPattern.exec(content)) !== null) {
    if (match[1] && !functions.includes(match[1])) {
      functions.push(match[1]);
    }
  }

  return functions;
}

// Extract class methods
function extractClassMethods(content: string): string[] {
  const methods = [];
  const methodPattern = /(?:async\s+)?(\w+)\s*\(\s*[^)]*\)\s*(?::|{)/g;
  let match;
  while ((match = methodPattern.exec(content)) !== null) {
    if (match[1] && !['if', 'for', 'while', 'switch', 'catch', 'function'].includes(match[1])) {
      methods.push(match[1]);
    }
  }
  return methods;
}

// Extract imports from code
function extractImportsFromCode(content: string): string[] {
  const imports: string[] = [];
  
  // ES6 imports
  const importPattern = /import\s+(?:{[^}]+}|[a-zA-Z_]\w*)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const pkg = match[1].split('/')[0];
    if (pkg && !imports.includes(pkg)) {
      imports.push(pkg);
    }
  }

  // CommonJS requires
  const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requirePattern.exec(content)) !== null) {
    const pkg = match[1].split('/')[0];
    if (pkg && !imports.includes(pkg)) {
      imports.push(pkg);
    }
  }

  return imports;
}

// Extract model fields from code
function extractModelFields(content: string): string[] {
  const fields: string[] = [];
  
  // TypeScript interfaces/types
  const typePattern = /(\w+)\s*:\s*(?:string|number|boolean|Date|ObjectId|any|(?:\w+\[\])|(?:typeof\s+\w+))/g;
  let match;
  while ((match = typePattern.exec(content)) !== null) {
    if (match[1] && !fields.includes(match[1])) {
      fields.push(match[1]);
    }
  }

  // Sequelize/Prisma model fields
  const modelPattern = /(\w+):\s*(?:DataTypes\.\w+|Sequelize\.\w+|\w+Field|Field|{[^}]*})/g;
  while ((match = modelPattern.exec(content)) !== null) {
    if (match[1] && !fields.includes(match[1])) {
      fields.push(match[1]);
    }
  }

  return fields;
}

// Extract API endpoints from file content
function extractAPIEndpoints(content: string, fileName: string): any[] {
  const endpoints = [];
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  // Match Express.js style: router.get('/path', ...)
  const expressPattern = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi;
  let match;
  while ((match = expressPattern.exec(content)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: fileName,
    });
  }

  // Match app.get style
  const appPattern = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi;
  while ((match = appPattern.exec(content)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: fileName,
    });
  }

  // Match FastAPI style: @app.get("/path")
  const fastapiPattern = /@app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi;
  while ((match = fastapiPattern.exec(content)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: fileName,
    });
  }

  // Match Flask style: @app.route("/path", methods=["GET"])
  const flaskPattern = /@app\.route\(['"]([^'"]+)['"].*methods=\[['"](\w+)['"]\]/gi;
  while ((match = flaskPattern.exec(content)) !== null) {
    endpoints.push({
      method: match[2].toUpperCase(),
      path: match[1],
      file: fileName,
    });
  }

  return endpoints;
}

// Generate Advanced High-Level Design (HLD) - System Architecture
function generateAdvancedHLD(analysis: any): string {
  let diagram = `graph TB\n`;
  diagram += `    %% ${analysis.repoName} - High-Level Design\n`;
  diagram += `    %% Project Type: ${analysis.projectType}\n\n`;

  // User/Client Layer
  diagram += `    User["👤 User/Client"]\n`;
  diagram += `    LoadBalancer["⚖️ Load Balancer<br/>(Nginx/HAProxy)"]\n\n`;

  // Frontend Layer
  if (analysis.frontend.framework) {
    diagram += `    subgraph Frontend ["🎨 Frontend Layer"]\n`;
    diagram += `        UI["${analysis.frontend.framework}<br/>User Interface"]\n`;
    diagram += `        Components["Components<br/>(${analysis.components.length} files)"]\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `        State["${analysis.frontend.stateManagement}<br/>State Management"]\n`;
      diagram += `        UI --> State\n`;
    }
    diagram += `        UI --> Components\n`;
    diagram += `    end\n\n`;
  }

  // API Gateway / Backend Entry
  diagram += `    subgraph Backend ["⚙️ Backend Layer"]\n`;
  if (analysis.backend.framework) {
    diagram += `        API["API Server<br/>${analysis.backend.framework}"]\n`;
  } else {
    diagram += `        API["API Server"]\n`;
  }
  
  // Routes/Controllers
  if (analysis.routes.length > 0) {
    diagram += `        Routes["API Routes<br/>(${analysis.apiEndpoints?.length || 0} endpoints)"]\n`;
    diagram += `        API --> Routes\n`;
  }

  // Middleware
  if (analysis.middlewares.length > 0) {
    diagram += `        Middleware["Middleware Layer<br/>Auth/Validation/Logging"]\n`;
    diagram += `        Routes --> Middleware\n`;
  }

  // Business Logic
  if (analysis.services.length > 0) {
    diagram += `        Services["Business Logic<br/>Services (${analysis.services.length} files)"]\n`;
    if (analysis.middlewares.length > 0) {
      diagram += `        Middleware --> Services\n`;
    } else {
      diagram += `        Routes --> Services\n`;
    }
  }

  // Data Access Layer
  if (analysis.models.length > 0) {
    diagram += `        DataAccess["Data Access Layer<br/>Models/Repositories"]\n`;
    if (analysis.services.length > 0) {
      diagram += `        Services --> DataAccess\n`;
    } else if (analysis.middlewares.length > 0) {
      diagram += `        Middleware --> DataAccess\n`;
    } else {
      diagram += `        Routes --> DataAccess\n`;
    }
  }
  diagram += `    end\n\n`;

  // Database Layer
  if (analysis.database.type) {
    diagram += `    subgraph Database ["💾 Data Layer"]\n`;
    diagram += `        DB["${analysis.database.type}<br/>Database"]\n`;
    if (analysis.database.models.length > 0) {
      diagram += `        Schemas["Data Models<br/>(${analysis.database.models.length} models)"]\n`;
      diagram += `        DB --> Schemas\n`;
    }
    if (analysis.database.migrations.length > 0) {
      diagram += `        Migrations["Migrations"]\n`;
    }
    diagram += `    end\n\n`;
  }

  // External Services
  diagram += `    subgraph External ["🌐 External Services"]\n`;
  diagram += `        Cache["Redis Cache<br/>(if applicable)"]\n`;
  diagram += `        Queue["Message Queue<br/>(if applicable)"]\n`;
  diagram += `        Storage["File Storage<br/>S3/CDN"]\n`;
  diagram += `    end\n\n`;

  // Docker/Deployment
  if (analysis.docker) {
    diagram += `    subgraph Deployment ["🐳 Deployment"]\n`;
    diagram += `        Docker["Docker Container"]\n`;
    if (analysis.ci) {
      diagram += `        CI["CI/CD Pipeline"]\n`;
    }
    diagram += `    end\n\n`;
  }

  // Connections
  diagram += `    User -->|HTTP/HTTPS| LoadBalancer\n`;
  
  if (analysis.frontend.framework) {
    diagram += `    LoadBalancer -->|Static Assets| UI\n`;
    diagram += `    UI -->|REST/GraphQL API| API\n`;
  } else {
    diagram += `    LoadBalancer --> API\n`;
  }

  if (analysis.database.type) {
    diagram += `    DataAccess -->|Query/CRUD| DB\n`;
  }

  diagram += `    Services -->|Read/Write| Cache\n`;
  diagram += `    Services -->|Async Tasks| Queue\n`;
  diagram += `    Services -->|Upload/Download| Storage\n`;

  if (analysis.docker) {
    diagram += `    API -.->|Containerized| Docker\n`;
    if (analysis.ci) {
      diagram += `    Docker -.->|Deploy| CI\n`;
    }
  }

  // Styling
  diagram += `\n    %% Styling\n`;
  diagram += `    style User fill:#3b82f6,stroke:#1e40af,stroke-width:3px,color:#fff\n`;
  diagram += `    style LoadBalancer fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff\n`;
  diagram += `    style Frontend fill:#10b981,stroke:#059669,stroke-width:2px\n`;
  diagram += `    style Backend fill:#f59e0b,stroke:#d97706,stroke-width:2px\n`;
  diagram += `    style Database fill:#ef4444,stroke:#dc2626,stroke-width:2px\n`;
  diagram += `    style External fill:#6366f1,stroke:#4f46e5,stroke-width:2px\n`;
  if (analysis.docker) {
    diagram += `    style Deployment fill:#14b8a6,stroke:#0d9488,stroke-width:2px\n`;
  }
  diagram += `    style API fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#000\n`;
  diagram += `    style DB fill:#f87171,stroke:#ef4444,stroke-width:2px,color:#fff\n`;

  return diagram;
}

// Generate Advanced Low-Level Design (LLD) - Detailed Component Architecture
function generateAdvancedLLD(analysis: any): string {
  let diagram = `graph TD\n`;
  diagram += `    %% ${analysis.repoName} - Low-Level Design (Detailed)\n`;
  diagram += `    %% Shows request flow through all layers\n\n`;

  // Client/Browser
  diagram += `    Client["🌐 Client Browser<br/>User Interface"]\n\n`;

  // Frontend Components (Detailed)
  if (analysis.frontend.framework) {
    diagram += `    subgraph FE ["Frontend Application (${analysis.frontend.framework})"]\n`;
    
    // Pages
    const pages = analysis.frontend.components.filter((c: any) => c.type === 'Page').slice(0, 5);
    if (pages.length > 0) {
      diagram += `        Pages["📄 Pages Layer"]\n`;
      pages.forEach((page: any, idx: number) => {
        diagram += `        Page${idx}["${page.name}"]\n`;
        diagram += `        Pages --> Page${idx}\n`;
      });
    }

    // Components
    if (analysis.components.length > 0) {
      diagram += `        CompLayer["🧩 Component Layer<br/>(${analysis.components.length} components)"]\n`;
      const topComponents = analysis.frontend.components.filter((c: any) => c.type === 'Component').slice(0, 6);
      topComponents.forEach((comp: any, idx: number) => {
        diagram += `        Comp${idx}["${comp.name}"]\n`;
        diagram += `        CompLayer --> Comp${idx}\n`;
      });
      if (pages.length > 0) {
        diagram += `        Pages --> CompLayer\n`;
      }
    }

    // State Management
    if (analysis.frontend.stateManagement) {
      diagram += `        StateManager["🔄 ${analysis.frontend.stateManagement}<br/>State Management"]\n`;
      diagram += `        Store["Global Store"]\n`;
      diagram += `        Actions["Actions/Dispatchers"]\n`;
      diagram += `        Reducers["Reducers/Handlers"]\n`;
      diagram += `        StateManager --> Store\n`;
      diagram += `        Store --> Actions\n`;
      diagram += `        Actions --> Reducers\n`;
      diagram += `        CompLayer --> StateManager\n`;
    }

    // API Client Layer
    diagram += `        APIClient["🔌 API Client Layer<br/>HTTP/Fetch/Axios"]\n`;
    diagram += `        APIService["API Services"]\n`;
    diagram += `        Interceptors["Request/Response<br/>Interceptors"]\n`;
    diagram += `        APIClient --> APIService\n`;
    diagram += `        APIService --> Interceptors\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `        Actions --> APIClient\n`;
    } else {
      diagram += `        CompLayer --> APIClient\n`;
    }
    
    diagram += `    end\n\n`;
  }

  // Backend API Layer (Very Detailed)
  diagram += `    subgraph BE ["Backend Application (${analysis.backend.framework || 'Server'})"]\n`;
  
  // API Gateway / Entry Point
  diagram += `        Gateway["🚪 API Gateway<br/>Entry Point"]\n`;
  
  // Routing Layer
  if (analysis.routes.length > 0) {
    diagram += `        Router["📍 Router Layer"]\n`;
    const topRoutes = analysis.backend.routes.slice(0, 5);
    topRoutes.forEach((route: any, idx: number) => {
      diagram += `        Route${idx}["${route.name}<br/>Route Handler"]\n`;
      diagram += `        Router --> Route${idx}\n`;
    });
    diagram += `        Gateway --> Router\n`;
  }

  // Middleware Stack
  if (analysis.middlewares.length > 0) {
    diagram += `        MiddlewareStack["🛡️ Middleware Stack"]\n`;
    diagram += `        AuthMW["Authentication<br/>Middleware"]\n`;
    diagram += `        ValidationMW["Request Validation<br/>Middleware"]\n`;
    diagram += `        LoggingMW["Logging Middleware"]\n`;
    diagram += `        ErrorMW["Error Handler"]\n`;
    diagram += `        MiddlewareStack --> AuthMW\n`;
    diagram += `        AuthMW --> ValidationMW\n`;
    diagram += `        ValidationMW --> LoggingMW\n`;
    diagram += `        LoggingMW --> ErrorMW\n`;
    if (analysis.routes.length > 0) {
      diagram += `        Router --> MiddlewareStack\n`;
    } else {
      diagram += `        Gateway --> MiddlewareStack\n`;
    }
  }

  // Controller Layer
  diagram += `        ControllerLayer["🎮 Controller Layer<br/>Request Handlers"]\n`;
  if (analysis.middlewares.length > 0) {
    diagram += `        MiddlewareStack --> ControllerLayer\n`;
  } else if (analysis.routes.length > 0) {
    diagram += `        Router --> ControllerLayer\n`;
  } else {
    diagram += `        Gateway --> ControllerLayer\n`;
  }

  // Business Logic / Service Layer
  if (analysis.services.length > 0) {
    diagram += `        ServiceLayer["💼 Business Logic Layer"]\n`;
    const topServices = analysis.services.slice(0, 5);
    topServices.forEach((service: any, idx: number) => {
      const serviceName = service.split('/').pop()?.replace(/\.(ts|js|py)$/, '') || `Service${idx}`;
      diagram += `        Service${idx}["${serviceName}<br/>Service"]\n`;
      diagram += `        ServiceLayer --> Service${idx}\n`;
    });
    diagram += `        ControllerLayer --> ServiceLayer\n`;
  }

  // Data Access Layer
  if (analysis.models.length > 0) {
    diagram += `        DAL["🗄️ Data Access Layer"]\n`;
    diagram += `        Repository["Repository Pattern"]\n`;
    diagram += `        QueryBuilder["Query Builder"]\n`;
    diagram += `        DAL --> Repository\n`;
    diagram += `        Repository --> QueryBuilder\n`;
    if (analysis.services.length > 0) {
      diagram += `        ServiceLayer --> DAL\n`;
    } else {
      diagram += `        ControllerLayer --> DAL\n`;
    }
  }

  // Utilities & Helpers
  if (analysis.utilities.length > 0) {
    diagram += `        Utils["🔧 Utilities<br/>Helpers/Libraries"]\n`;
    if (analysis.services.length > 0) {
      diagram += `        ServiceLayer -.-> Utils\n`;
    }
    diagram += `        ControllerLayer -.-> Utils\n`;
  }

  diagram += `    end\n\n`;

  // Database Layer (Detailed)
  if (analysis.database.type) {
    diagram += `    subgraph DB ["Database Layer (${analysis.database.type})"]\n`;
    diagram += `        DBConnection["Connection Pool"]\n`;
    diagram += `        DBEngine["Database Engine"]\n`;
    
    if (analysis.database.models.length > 0) {
      const topModels = analysis.database.models.slice(0, 6);
      topModels.forEach((model: any, idx: number) => {
        diagram += `        Table${idx}["${model.name}<br/>Table/Collection"]\n`;
        diagram += `        DBEngine --> Table${idx}\n`;
      });
    }
    
    diagram += `        DBConnection --> DBEngine\n`;
    diagram += `    end\n\n`;
  }

  // Cache Layer
  diagram += `    Cache["⚡ Redis Cache<br/>Session/Data Cache"]\n\n`;

  // Message Queue
  diagram += `    Queue["📬 Message Queue<br/>Background Jobs"]\n\n`;

  // External APIs
  diagram += `    ExtAPI["🌍 External APIs<br/>Third-party Services"]\n\n`;

  // Connections
  diagram += `    Client -->|HTTPS Request| Gateway\n`;
  
  if (analysis.frontend.framework) {
    diagram += `    APIClient -->|REST/GraphQL| Gateway\n`;
  }

  if (analysis.database.type) {
    diagram += `    QueryBuilder -->|SQL/NoSQL Query| DBConnection\n`;
  }

  if (analysis.services.length > 0) {
    diagram += `    ServiceLayer -.->|Read/Write| Cache\n`;
    diagram += `    ServiceLayer -.->|Async Tasks| Queue\n`;
    diagram += `    ServiceLayer -.->|API Calls| ExtAPI\n`;
  }

  diagram += `    ControllerLayer -->|Response| Gateway\n`;
  diagram += `    Gateway -->|JSON Response| Client\n`;

  // Styling
  diagram += `\n    %% Styling\n`;
  diagram += `    style Client fill:#3b82f6,stroke:#1e40af,stroke-width:3px,color:#fff\n`;
  diagram += `    style FE fill:#10b981,stroke:#059669,stroke-width:2px\n`;
  diagram += `    style BE fill:#f59e0b,stroke:#d97706,stroke-width:2px\n`;
  diagram += `    style DB fill:#ef4444,stroke:#dc2626,stroke-width:2px\n`;
  diagram += `    style Gateway fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff\n`;
  diagram += `    style Router fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff\n`;
  diagram += `    style ControllerLayer fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff\n`;
  diagram += `    style ServiceLayer fill:#eab308,stroke:#ca8a04,stroke-width:2px,color:#000\n`;
  diagram += `    style DAL fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff\n`;
  diagram += `    style Cache fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff\n`;
  diagram += `    style Queue fill:#a855f7,stroke:#9333ea,stroke-width:2px,color:#fff\n`;

  return diagram;
}

// Generate Advanced Database Schema - Detailed Entity Relationships
function generateAdvancedDatabaseSchema(analysis: any): string {
  let diagram = `erDiagram\n`;
  diagram += `    %% ${analysis.repoName} - Database Schema\n`;
  diagram += `    %% ${analysis.database.type || 'Database'} Model Relationships\n\n`;

  if (analysis.database.models.length === 0) {
    // Create generic schema based on detected patterns
    diagram += `    USER {\n`;
    diagram += `        string id PK\n`;
    diagram += `        string email UK "unique"\n`;
    diagram += `        string password\n`;
    diagram += `        string name\n`;
    diagram += `        timestamp createdAt\n`;
    diagram += `        timestamp updatedAt\n`;
    diagram += `    }\n\n`;

    if (analysis.backend.framework) {
      diagram += `    SESSION {\n`;
      diagram += `        string id PK\n`;
      diagram += `        string userId FK\n`;
      diagram += `        string token\n`;
      diagram += `        timestamp expiresAt\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `    }\n\n`;

      diagram += `    USER ||--o{ SESSION : "has many"\n`;
    }

    return diagram;
  }

  // Process actual models
  const models = analysis.database.models.slice(0, 10); // Limit to top 10 models
  
  models.forEach((model: any) => {
    diagram += `    ${model.name.toUpperCase()} {\n`;
    
    // Add common fields based on model name patterns
    if (model.name.toLowerCase().includes('user')) {
      diagram += `        string id PK "Primary Key"\n`;
      diagram += `        string email UK "unique email"\n`;
      diagram += `        string password "hashed"\n`;
      diagram += `        string firstName\n`;
      diagram += `        string lastName\n`;
      diagram += `        string role "admin/user/guest"\n`;
      diagram += `        boolean isActive\n`;
      diagram += `        timestamp lastLogin\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else if (model.name.toLowerCase().includes('post') || model.name.toLowerCase().includes('article')) {
      diagram += `        string id PK\n`;
      diagram += `        string userId FK "author"\n`;
      diagram += `        string title\n`;
      diagram += `        text content\n`;
      diagram += `        string status "draft/published"\n`;
      diagram += `        int views\n`;
      diagram += `        int likes\n`;
      diagram += `        timestamp publishedAt\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else if (model.name.toLowerCase().includes('comment')) {
      diagram += `        string id PK\n`;
      diagram += `        string userId FK\n`;
      diagram += `        string postId FK\n`;
      diagram += `        text content\n`;
      diagram += `        int likes\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else if (model.name.toLowerCase().includes('product')) {
      diagram += `        string id PK\n`;
      diagram += `        string name\n`;
      diagram += `        text description\n`;
      diagram += `        decimal price\n`;
      diagram += `        int stock\n`;
      diagram += `        string category\n`;
      diagram += `        string sku UK "unique"\n`;
      diagram += `        boolean isActive\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else if (model.name.toLowerCase().includes('order')) {
      diagram += `        string id PK\n`;
      diagram += `        string userId FK\n`;
      diagram += `        string status "pending/completed/cancelled"\n`;
      diagram += `        decimal totalAmount\n`;
      diagram += `        string paymentMethod\n`;
      diagram += `        timestamp orderedAt\n`;
      diagram += `        timestamp deliveredAt\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else if (model.name.toLowerCase().includes('category') || model.name.toLowerCase().includes('tag')) {
      diagram += `        string id PK\n`;
      diagram += `        string name UK\n`;
      diagram += `        text description\n`;
      diagram += `        string slug UK\n`;
      diagram += `        int count "item count"\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    } else {
      // Generic model structure
      diagram += `        string id PK\n`;
      diagram += `        string name\n`;
      diagram += `        text description\n`;
      diagram += `        string status\n`;
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    }
    
    diagram += `    }\n\n`;
  });

  // Add relationships based on common patterns
  const modelNames = models.map((m: any) => m.name.toLowerCase());
  
  if (modelNames.includes('user')) {
    // User relationships
    if (modelNames.includes('post') || modelNames.includes('article')) {
      diagram += `    USER ||--o{ POST : "creates"\n`;
    }
    if (modelNames.includes('comment')) {
      diagram += `    USER ||--o{ COMMENT : "writes"\n`;
      if (modelNames.includes('post')) {
        diagram += `    POST ||--o{ COMMENT : "has"\n`;
      }
    }
    if (modelNames.includes('order')) {
      diagram += `    USER ||--o{ ORDER : "places"\n`;
    }
    if (modelNames.includes('profile')) {
      diagram += `    USER ||--|| PROFILE : "has"\n`;
    }
    if (modelNames.includes('session')) {
      diagram += `    USER ||--o{ SESSION : "has"\n`;
    }
  }

  if (modelNames.includes('product')) {
    if (modelNames.includes('category')) {
      diagram += `    CATEGORY ||--o{ PRODUCT : "contains"\n`;
    }
    if (modelNames.includes('order')) {
      diagram += `    ORDER ||--o{ ORDERITEM : "contains"\n`;
      diagram += `    PRODUCT ||--o{ ORDERITEM : "included in"\n`;
      
      // Add OrderItem junction table if not in models
      if (!modelNames.includes('orderitem')) {
        diagram += `\n    ORDERITEM {\n`;
        diagram += `        string id PK\n`;
        diagram += `        string orderId FK\n`;
        diagram += `        string productId FK\n`;
        diagram += `        int quantity\n`;
        diagram += `        decimal price\n`;
        diagram += `    }\n\n`;
      }
    }
    if (modelNames.includes('review')) {
      diagram += `    PRODUCT ||--o{ REVIEW : "has"\n`;
      diagram += `    USER ||--o{ REVIEW : "writes"\n`;
    }
  }

  if (modelNames.includes('post') || modelNames.includes('article')) {
    if (modelNames.includes('tag')) {
      diagram += `    POST }o--o{ TAG : "tagged with"\n`;
      
      // Add junction table
      diagram += `\n    POST_TAG {\n`;
      diagram += `        string postId FK\n`;
      diagram += `        string tagId FK\n`;
      diagram += `    }\n\n`;
    }
    if (modelNames.includes('category')) {
      diagram += `    CATEGORY ||--o{ POST : "contains"\n`;
    }
  }

  return diagram;
}

// Generate Sequence Diagram
// Generate Advanced Sequence Diagram - Detailed Request Flow
function generateAdvancedSequenceDiagram(analysis: any): string {
  let diagram = `sequenceDiagram\n`;
  diagram += `    %% ${analysis.repoName} - API Request Flow\n`;
  diagram += `    %% Detailed sequence showing complete lifecycle\n\n`;

  // Participants
  diagram += `    actor User as 👤 User/Client\n`;
  diagram += `    participant Browser as 🌐 Browser\n`;
  
  if (analysis.frontend.framework) {
    diagram += `    participant FE as ⚛️ ${analysis.frontend.framework}<br/>Frontend\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `    participant State as 🔄 ${analysis.frontend.stateManagement}<br/>Store\n`;
    }
  }
  
  diagram += `    participant LB as ⚖️ Load Balancer\n`;
  diagram += `    participant Gateway as 🚪 API Gateway\n`;
  diagram += `    participant Auth as 🔐 Auth Service\n`;
  diagram += `    participant API as 🎮 ${analysis.backend.framework || 'API'}<br/>Backend\n`;
  
  if (analysis.services.length > 0) {
    diagram += `    participant Service as 💼 Business Logic<br/>Service\n`;
  }
  
  diagram += `    participant Cache as ⚡ Redis Cache\n`;
  
  if (analysis.database.type) {
    diagram += `    participant DB as 🗄️ ${analysis.database.type}<br/>Database\n`;
  }
  
  diagram += `    participant Queue as 📬 Message Queue\n`;
  diagram += `    participant Ext as 🌍 External API\n\n`;

  // Activation boxes
  diagram += `    autonumber\n\n`;

  // Scenario 1: GET Request (Read Operation)
  diagram += `    %% Scenario 1: Successful GET Request\n`;
  diagram += `    Note over User,DB: READ Operation - Fetch Data\n\n`;
  
  diagram += `    User->>+Browser: Opens application\n`;
  diagram += `    Browser->>+FE: Load React app\n`;
  
  if (analysis.frontend.stateManagement) {
    diagram += `    FE->>+State: Check cached data\n`;
    diagram += `    State-->>-FE: Data not found\n`;
  }
  
  // Pick a real API endpoint if available
  const getEndpoint = analysis.apiEndpoints?.find((e: any) => e.method === 'GET')?.path || '/api/data';
  
  diagram += `    FE->>+LB: HTTP GET ${getEndpoint}\n`;
  diagram += `    LB->>+Gateway: Forward request\n`;
  diagram += `    Gateway->>+Auth: Validate JWT token\n`;
  diagram += `    Auth-->>-Gateway: Token valid ✓\n`;
  diagram += `    Gateway->>+API: Route to handler\n`;
  
  diagram += `    API->>+Cache: Check cache for key\n`;
  diagram += `    Cache-->>-API: Cache miss ✗\n`;
  
  if (analysis.services.length > 0) {
    diagram += `    API->>+Service: Fetch data request\n`;
  }
  
  if (analysis.database.type) {
    const target = analysis.services.length > 0 ? 'Service' : 'API';
    diagram += `    ${target}->>+DB: SELECT query\n`;
    diagram += `    DB-->>-${target}: Return rows\n`;
  }
  
  if (analysis.services.length > 0) {
    diagram += `    Service-->>-API: Processed data\n`;
  }
  
  diagram += `    API->>Cache: Store in cache (TTL: 5m)\n`;
  diagram += `    API-->>-Gateway: 200 OK + JSON\n`;
  diagram += `    Gateway-->>-LB: Response\n`;
  diagram += `    LB-->>-FE: Response payload\n`;
  
  if (analysis.frontend.stateManagement) {
    diagram += `    FE->>State: Update store\n`;
  }
  
  diagram += `    FE-->>-Browser: Render UI\n`;
  diagram += `    Browser-->>-User: Display data ✓\n\n`;

  // Scenario 2: POST Request (Write Operation)
  diagram += `    %% Scenario 2: POST Request with Validation\n`;
  diagram += `    Note over User,Queue: WRITE Operation - Create Resource\n\n`;
  
  const postEndpoint = analysis.apiEndpoints?.find((e: any) => e.method === 'POST')?.path || '/api/create';
  
  diagram += `    User->>+Browser: Submit form\n`;
  diagram += `    Browser->>+FE: Form data\n`;
  diagram += `    FE->>FE: Client-side validation\n`;
  diagram += `    FE->>+LB: HTTP POST ${postEndpoint}\n`;
  diagram += `    LB->>+Gateway: Forward request\n`;
  diagram += `    Gateway->>+Auth: Validate token\n`;
  diagram += `    Auth-->>-Gateway: Authorized ✓\n`;
  diagram += `    Gateway->>+API: Route + body\n`;
  diagram += `    API->>API: Request validation\n`;
  
  if (analysis.services.length > 0) {
    diagram += `    API->>+Service: Business logic\n`;
    diagram += `    Service->>Service: Process data\n`;
  }
  
  if (analysis.database.type) {
    const target = analysis.services.length > 0 ? 'Service' : 'API';
    diagram += `    ${target}->>+DB: INSERT query\n`;
    diagram += `    DB-->>-${target}: Success (ID: 123)\n`;
  }
  
  // Async operations
  diagram += `    ${analysis.services.length > 0 ? 'Service' : 'API'}->>Queue: Publish event (async)\n`;
  diagram += `    Note right of Queue: Email notification<br/>sent later\n`;
  
  if (analysis.services.length > 0) {
    diagram += `    Service-->>-API: Created object\n`;
  }
  
  diagram += `    API->>Cache: Invalidate related cache\n`;
  diagram += `    API-->>-Gateway: 201 Created + Location\n`;
  diagram += `    Gateway-->>-LB: Response\n`;
  diagram += `    LB-->>-FE: New resource\n`;
  
  if (analysis.frontend.stateManagement) {
    diagram += `    FE->>State: Add to store\n`;
  }
  
  diagram += `    FE-->>-Browser: Update UI\n`;
  diagram += `    Browser-->>-User: Success message ✓\n\n`;

  // Scenario 3: Error Handling
  diagram += `    %% Scenario 3: Error Handling (401 Unauthorized)\n`;
  diagram += `    Note over User,API: ERROR Flow\n\n`;
  
  diagram += `    User->>+Browser: Protected action\n`;
  diagram += `    Browser->>+FE: API call\n`;
  diagram += `    FE->>+LB: HTTP GET /api/protected\n`;
  diagram += `    LB->>+Gateway: Forward\n`;
  diagram += `    Gateway->>+Auth: Validate token\n`;
  diagram += `    Auth-->>-Gateway: Token expired ✗\n`;
  diagram += `    Gateway-->>-LB: 401 Unauthorized\n`;
  diagram += `    LB-->>-FE: Error response\n`;
  diagram += `    FE->>FE: Clear auth state\n`;
  diagram += `    FE-->>-Browser: Redirect to login\n`;
  diagram += `    Browser-->>-User: Login page ⚠️\n\n`;

  // Scenario 4: External API Integration
  if (analysis.apiEndpoints && analysis.apiEndpoints.length > 3) {
    diagram += `    %% Scenario 4: External API Integration\n`;
    diagram += `    Note over API,Ext: Third-party Service Call\n\n`;
    
    diagram += `    User->>+FE: Request data\n`;
    diagram += `    FE->>+API: API call\n`;
    
    if (analysis.services.length > 0) {
      diagram += `    API->>+Service: Process request\n`;
      diagram += `    Service->>+Ext: External API call\n`;
      diagram += `    Ext-->>-Service: External data\n`;
      diagram += `    Service->>Service: Transform data\n`;
      diagram += `    Service-->>-API: Enriched data\n`;
    } else {
      diagram += `    API->>+Ext: External API call\n`;
      diagram += `    Ext-->>-API: External data\n`;
    }
    
    diagram += `    API-->>-FE: Response\n`;
    diagram += `    FE-->>-User: Display ✓\n`;
  }

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
