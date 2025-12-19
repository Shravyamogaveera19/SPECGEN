import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function generateDiagram(req: Request, res: Response) {
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
    } as const;

    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Return specific diagram or all diagrams
    const selectedDiagram = diagramType && (diagrams as any)[diagramType] 
      ? (diagrams as any)[diagramType]
      : diagrams.hld;

    res.json({
      ok: true,
      diagram: selectedDiagram,
      diagrams,
      codeDetails: {
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
        services: analysis.backend.services.map((s: any) => ({
          name: s.name,
          path: s.path,
          methods: s.methods || [],
          lineCount: s.lineCount || 0,
          isClass: s.isClass || false,
        })),
        endpoints: (analysis.apiEndpoints || []).map((e: any) => ({
          method: e.method,
          path: e.path,
          file: e.file,
        })).slice(0, 20),
        models: analysis.database.models.map((m: any) => ({
          name: m.name,
          path: m.path,
          fields: m.fields || [],
          lineCount: m.lineCount || 0,
          hasValidation: m.hasValidation || false,
        })),
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
}

// Deep analyze repository structure with actual file parsing
async function deepAnalyzeRepository(repoPath: string, repoName: string) {
  const analysis: any = {
    repoName,
    projectType: 'Unknown',
    architecture: 'Unknown',
    totalFiles: 0,
    isUtility: false,
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
    cobolProcedures: [],
    docker: false,
    ci: false,
    languages: [],
    dependencies: [],
    devDependencies: [],
  };

  const scanDir = (dir: string, baseDir: string = dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

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

        if (ext && !analysis.languages.includes(ext.slice(1))) {
          analysis.languages.push(ext.slice(1));
        }

        // COBOL detection
        if (ext === '.cob' || ext === '.cobol' || ext === '.cbl') {
          analysis.projectType = 'COBOL Application';
          analysis.architecture = 'Procedural';
          analysis.isUtility = true;
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const procedures = extractCobolProcedures(content);
            analysis.cobolProcedures.push({
              file: relativePath,
              fileName: entry.name,
              procedures,
              lineCount: content.split('\n').length,
            });
          } catch {}
        }

        // package.json parsing
        if (fileName === 'package.json') {
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            analysis.dependencies = Object.keys(pkg.dependencies || {});
            analysis.devDependencies = Object.keys(pkg.devDependencies || {});

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

            if (pkg.dependencies?.redux || pkg.dependencies?.['@reduxjs/toolkit']) {
              analysis.frontend.stateManagement = 'Redux';
            }
            if (pkg.dependencies?.zustand) {
              analysis.frontend.stateManagement = 'Zustand';
            }
            if (pkg.dependencies?.mobx) {
              analysis.frontend.stateManagement = 'MobX';
            }
          } catch {}
        }

        // Python requirements
        if (fileName === 'requirements.txt') {
          analysis.projectType = 'Python Application';
          try {
            const requirements = fs.readFileSync(fullPath, 'utf-8');
            if (requirements.includes('django')) analysis.backend.framework = 'Django';
            if (requirements.includes('flask')) analysis.backend.framework = 'Flask';
            if (requirements.includes('fastapi')) analysis.backend.framework = 'FastAPI';
          } catch {}
        }

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
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const endpoints = extractAPIEndpoints(content, entry.name);
            analysis.apiEndpoints.push(...endpoints);
          } catch {}
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
        if (lowerPath.includes('service') && (ext === '.ts' || ext === '.js' || ext === '.py')) {
          analysis.backend.services.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.services.push(relativePath);
        }

        // Middleware
        if (lowerPath.includes('middleware') && (ext === '.ts' || ext === '.js')) {
          analysis.backend.middleware.push({
            name: entry.name.replace(ext, ''),
            path: relativePath,
          });
          analysis.middlewares.push(relativePath);
        }

        if (lowerPath.includes('migration') || lowerPath.includes('migrate')) {
          analysis.database.migrations.push(relativePath);
        }

        if (fileName.includes('dockerfile') || fileName === 'docker-compose.yml') {
          analysis.docker = true;
        }

        if (lowerPath.includes('.github/workflows') || fileName === '.gitlab-ci.yml' || fileName === 'jenkinsfile') {
          analysis.ci = true;
        }

        if (lowerPath.includes('test') || lowerPath.includes('spec') || fileName.includes('.test.') || fileName.includes('.spec.')) {
          analysis.tests.push(relativePath);
        }

        if (ext === '.json' || ext === '.yml' || ext === '.yaml' || fileName.includes('config') || fileName === '.env.example') {
          analysis.config.push(relativePath);
        }

        if (lowerPath.includes('util') || lowerPath.includes('helper') || lowerPath.includes('lib')) {
          analysis.utilities.push(relativePath);
        }
      }
    }
  };

  scanDir(repoPath);

  // Enhanced project type detection
  const hasJavaFiles = analysis.languages.includes('java');
  const hasCobolFiles = analysis.languages.includes('cob') || analysis.languages.includes('cobol') || analysis.languages.includes('cbl');
  const hasCppFiles = analysis.languages.includes('cpp') || analysis.languages.includes('cc') || analysis.languages.includes('c');
  const hasGoFiles = analysis.languages.includes('go');
  const hasRustFiles = analysis.languages.includes('rs');
  const hasPythonFiles = analysis.languages.includes('py');
  const hasJsFiles = analysis.languages.includes('js') || analysis.languages.includes('ts');

  // Single language utility detection
  const singleLanguageCount = [
    hasJavaFiles, hasCobolFiles, hasCppFiles, hasGoFiles, hasRustFiles, hasPythonFiles
  ].filter(Boolean).length;

  const noAppStructure = 
    analysis.routes.length === 0 &&
    analysis.services.length === 0 &&
    analysis.models.length === 0 &&
    analysis.apiEndpoints.length === 0 &&
    !analysis.database.type &&
    !analysis.frontend.framework &&
    !analysis.backend.framework;

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
  } else if (hasCobolFiles && singleLanguageCount === 1 && noAppStructure) {
    // COBOL detected
    analysis.projectType = 'COBOL Application';
    analysis.architecture = 'Procedural/Business Logic';
    analysis.isUtility = true;
    analysis.isCobol = true;
  } else if (hasJavaFiles && singleLanguageCount === 1 && noAppStructure) {
    // Java utility (not framework-based)
    analysis.projectType = 'Java Utility Application';
    analysis.architecture = 'OOP/Procedural';
    analysis.isUtility = true;
    analysis.isJava = true;
  } else if ((hasCppFiles || hasRustFiles || hasGoFiles) && singleLanguageCount === 1 && noAppStructure) {
    // Systems language utility
    const langName = hasCppFiles ? 'C++' : hasRustFiles ? 'Rust' : 'Go';
    analysis.projectType = `${langName} Utility Application`;
    analysis.architecture = 'Systems Programming';
    analysis.isUtility = true;
    analysis.isSystems = true;
  } else if (hasPythonFiles && singleLanguageCount === 1 && noAppStructure) {
    // Python script/utility
    analysis.projectType = 'Python Utility Application';
    analysis.architecture = 'Script-based';
    analysis.isUtility = true;
    analysis.isPython = true;
  } else if (noAppStructure && analysis.totalFiles > 0) {
    // Generic utility
    analysis.projectType = 'Utility/CLI Application';
    analysis.architecture = 'Single-process';
    analysis.isUtility = true;
  }

  const enrichedAnalysis = enrichAnalysisWithCodeDetails(repoPath, analysis);
  return enrichedAnalysis;
}

function enrichAnalysisWithCodeDetails(repoPath: string, analysis: any): any {
  analysis.frontend.components = analysis.frontend.components.map((comp: any) => {
    const fullPath = path.join(repoPath, comp.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const functions = extractFunctionsFromCode(content);
      const imports = extractImportsFromCode(content);
      return {
        ...comp,
        functions: functions.slice(0, 5),
        imports: imports.slice(0, 5),
        lineCount: content.split('\n').length,
        hasHooks: content.includes('useState') || content.includes('useEffect'),
        hasProps: content.includes('props') || content.includes('interface Props'),
      };
    } catch {
      return comp;
    }
  });

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
    } catch {
      return service;
    }
  });

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
    } catch {
      return model;
    }
  });

  analysis.backend.routes = analysis.backend.routes.map((route: any) => {
    const fullPath = path.join(repoPath, route.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const endpoints = extractAPIEndpoints(content, route.name);
      const functions = extractFunctionsFromCode(content);
      return {
        ...route,
        endpoints,
        handlers: functions.slice(0, 5),
        lineCount: content.split('\n').length,
      };
    } catch {
      return route;
    }
  });

  return analysis;
}

function extractFunctionsFromCode(content: string): string[] {
  const functions: string[] = [];
  const funcPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  let match;
  while ((match = funcPattern.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (name && !functions.includes(name)) functions.push(name);
  }
  const pyFuncPattern = /def\s+(\w+)\s*\(/g;
  while ((match = pyFuncPattern.exec(content)) !== null) {
    if (match[1] && !functions.includes(match[1])) functions.push(match[1]);
  }
  return functions;
}

function extractClassMethods(content: string): string[] {
  const methods: string[] = [];
  const methodPattern = /(?:async\s+)?(\w+)\s*\(\s*[^)]*\)\s*(?::|{)/g;
  let match;
  while ((match = methodPattern.exec(content)) !== null) {
    if (match[1] && !['if','for','while','switch','catch','function'].includes(match[1])) {
      methods.push(match[1]);
    }
  }
  return methods;
}

function extractImportsFromCode(content: string): string[] {
  const imports: string[] = [];
  const importPattern = /import\s+(?:{[^}]+}|[a-zA-Z_]\w*)\s+from\s+['"]([^'\"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const pkg = match[1].split('/')[0];
    if (pkg && !imports.includes(pkg)) imports.push(pkg);
  }
  const requirePattern = /require\s*\(\s*['"]([^'\"]+)['"]\s*\)/g;
  while ((match = requirePattern.exec(content)) !== null) {
    const pkg = match[1].split('/')[0];
    if (pkg && !imports.includes(pkg)) imports.push(pkg);
  }
  return imports;
}

function extractModelFields(content: string): {name: string, type: string}[] {
  const fields: {name: string, type: string}[] = [];
  
  // TypeScript/JavaScript interface/type pattern
  const tsPattern = /(\w+)\s*:\s*(string|number|boolean|Date|ObjectId|UUID|any|Record|Map|Array|Set|boolean\[\]|string\[\]|number\[\]|[A-Z]\w*(?:\[\])?)/g;
  let match;
  while ((match = tsPattern.exec(content)) !== null) {
    const fieldName = match[1];
    const fieldType = match[2];
    if (fieldName && fieldType && fieldName !== 'interface' && fieldName !== 'type' && fieldName !== 'class') {
      const exists = fields.find(f => f.name === fieldName);
      if (!exists) {
        fields.push({
          name: fieldName,
          type: normalizeType(fieldType)
        });
      }
    }
  }

  // Mongoose/Sequelize field pattern
  const mongoPattern = /(\w+):\s*(?:new\s+)?(?:Schema\.|mongoose\.)?(?:Schema\.)?Types\.(?:ObjectId|String|Number|Boolean|Date|Mixed)/g;
  while ((match = mongoPattern.exec(content)) !== null) {
    const fieldName = match[1];
    if (fieldName && !fields.find(f => f.name === fieldName)) {
      fields.push({
        name: fieldName,
        type: 'string'
      });
    }
  }

  // Java field pattern
  const javaPattern = /(?:private|public|protected)?\s+(String|int|boolean|long|double|float|List|Set|LocalDateTime|UUID)\s+(\w+)\s*[;=]/g;
  while ((match = javaPattern.exec(content)) !== null) {
    const fieldType = match[1];
    const fieldName = match[2];
    if (fieldName && !fields.find(f => f.name === fieldName)) {
      fields.push({
        name: fieldName,
        type: fieldType.toLowerCase().includes('string') ? 'string' : 
              fieldType.toLowerCase().includes('int') ? 'integer' :
              fieldType.toLowerCase().includes('date') ? 'timestamp' :
              fieldType.toLowerCase().includes('bool') ? 'boolean' : 'string'
      });
    }
  }

  // COBOL field pattern
  const cobolPattern = /05\s+(\w+)\s+PIC\s+([\w\(\)\.]+)/g;
  while ((match = cobolPattern.exec(content)) !== null) {
    const fieldName = match[1];
    const pic = match[2];
    if (fieldName && !fields.find(f => f.name === fieldName)) {
      const fieldType = pic.includes('X') ? 'string' : 
                       pic.includes('9') ? 'integer' : 'string';
      fields.push({
        name: fieldName,
        type: fieldType
      });
    }
  }

  return fields.slice(0, 15);
}

function normalizeType(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('string') || lowerType.includes('text')) return 'string';
  if (lowerType.includes('number') || lowerType.includes('int') || lowerType.includes('decimal')) return 'integer';
  if (lowerType.includes('boolean') || lowerType.includes('bool')) return 'boolean';
  if (lowerType.includes('date') || lowerType.includes('time')) return 'timestamp';
  if (lowerType.includes('objectid') || lowerType.includes('uuid')) return 'id';
  return 'string';
}

function extractCobolProcedures(content: string): string[] {
  const procedures: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.length > 6 && (line[6] === '*' || line[6] === '/')) continue;
    const trimmed = line.substring(7).trim();
    const paragraphPattern = /^([A-Z][A-Z0-9\-]*)\s*\.$/;
    const match = trimmed.match(paragraphPattern);
    if (match && match[1]) {
      const procName = match[1];
      if (!procedures.includes(procName)) procedures.push(procName);
    }
    const performPattern = /PERFORM\s+([A-Z][A-Z0-9\-]*)/i;
    const performMatch = trimmed.match(performPattern);
    if (performMatch && performMatch[1]) {
      const procName = performMatch[1].toUpperCase();
      if (!procedures.includes(procName)) procedures.push(procName);
    }
  }
  return procedures;
}

function extractAPIEndpoints(content: string, fileName: string): any[] {
  const endpoints: any[] = [];
  const expressPattern = /router\.(get|post|put|delete|patch)\(['"]([^'\"]+)['"]/gi;
  let match;
  while ((match = expressPattern.exec(content)) !== null) {
    endpoints.push({ method: match[1].toUpperCase(), path: match[2], file: fileName });
  }
  const appPattern = /app\.(get|post|put|delete|patch)\(['"]([^'\"]+)['"]/gi;
  while ((match = appPattern.exec(content)) !== null) {
    endpoints.push({ method: match[1].toUpperCase(), path: match[2], file: fileName });
  }
  const fastapiPattern = /@app\.(get|post|put|delete|patch)\(['"]([^'\"]+)['"]/gi;
  while ((match = fastapiPattern.exec(content)) !== null) {
    endpoints.push({ method: match[1].toUpperCase(), path: match[2], file: fileName });
  }
  const flaskPattern = /@app\.route\(['"]([^'\"]+)['"].*methods=\[['"](\w+)['"]\]/gi;
  while ((match = flaskPattern.exec(content)) !== null) {
    endpoints.push({ method: match[2].toUpperCase(), path: match[1], file: fileName });
  }
  return endpoints;
}

function generateAdvancedHLD(analysis: any): string {
  let diagram = `graph TB\n`;
  diagram += `    %% ${analysis.repoName} - High-Level Design\n`;
  diagram += `    %% Project Type: ${analysis.projectType}\n`;
  diagram += `    %% Architecture: ${analysis.architecture}\n\n`;

  // COBOL Applications - Business Logic Style
  if (analysis.isCobol) {
    const procedures = analysis.cobolProcedures?.[0]?.procedures || [];
    const procCount = procedures.length > 0 ? procedures.length : '1+';
    diagram += `    Input["📥 Input Data"]:::inputNode\n`;
    diagram += `    subgraph Procedures ["🔧 COBOL Program"]\n`;
    diagram += `        MainProc["MAIN-PROCEDURE"]:::mainNode\n`;
    if (procedures.length > 0) {
      diagram += `        Proc1["${procedures[0] || 'PROCESS'}"]:::procNode\n`;
      if (procedures.length > 1) {
        diagram += `        Proc2["${procedures[1] || 'CALCULATE'}"]:::procNode\n`;
      }
    }
    diagram += `    end\n`;
    diagram += `    Output["📤 Output<br/>(${analysis.cobolProcedures?.[0]?.procedures?.length || 1} procedures)"]:::outputNode\n`;
    diagram += `\n    Input -->|ACCEPT| MainProc\n`;
    if (procedures.length > 0) {
      diagram += `    MainProc -->|PERFORM| Proc1\n`;
      if (procedures.length > 1) {
        diagram += `    Proc1 -->|PERFORM| Proc2\n`;
        diagram += `    Proc2 -->|DISPLAY| Output\n`;
      } else {
        diagram += `    Proc1 -->|DISPLAY| Output\n`;
      }
    } else {
      diagram += `    MainProc -->|Process| Output\n`;
    }
    diagram += `\n    classDef inputNode fill:#001f3f,stroke:#00ffff,stroke-width:3px,color:#00ffff,font-weight:bold\n`;
    diagram += `    classDef mainNode fill:#003d7a,stroke:#00bfff,stroke-width:2px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef procNode fill:#0055cc,stroke:#1e90ff,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef outputNode fill:#001a4d,stroke:#00ffff,stroke-width:3px,color:#00ffff,font-weight:bold\n`;
    diagram += `    classDef Procedures fill:#1a1a2e,stroke:#16c784,stroke-width:2px\n`;
    return diagram;
  }

  // Java Applications - OOP Style
  if (analysis.isJava) {
    diagram += `    Input["📥 Input"]:::inputNode\n`;
    diagram += `    subgraph JVM ["☕ Java Virtual Machine"]\n`;
    diagram += `        Main["Main Class"]:::javaMainNode\n`;
    diagram += `        Classes["Object Classes<br/>(OOP Design)"]:::javaClassNode\n`;
    diagram += `        Logic["Business Logic<br/>(Algorithms)"]:::logicNode\n`;
    diagram += `    end\n`;
    diagram += `    Output["📤 Output"]:::outputNode\n`;
    diagram += `\n    Input -->|Parameters| Main\n`;
    diagram += `    Main -->|Instantiate| Classes\n`;
    diagram += `    Classes -->|Execute| Logic\n`;
    diagram += `    Logic -->|Results| Output\n`;
    diagram += `\n    classDef inputNode fill:#2c2c2c,stroke:#ff8a00,stroke-width:3px,color:#ff8a00,font-weight:bold\n`;
    diagram += `    classDef javaMainNode fill:#1a1a1a,stroke:#ff8a00,stroke-width:2px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef javaClassNode fill:#4a4a4a,stroke:#ffaa33,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef logicNode fill:#2a2a2a,stroke:#ffcc33,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef outputNode fill:#1a1a1a,stroke:#ff8a00,stroke-width:3px,color:#ff8a00,font-weight:bold\n`;
    diagram += `    classDef JVM fill:#3a3a3a,stroke:#ff8a00,stroke-width:2px\n`;
    return diagram;
  }

  // C++/Rust/Go - Systems Programming Style
  if (analysis.isSystems) {
    const langEmoji = analysis.languages?.includes('cpp') ? '⚙️' : analysis.languages?.includes('rs') ? '🦀' : '🐹';
    const langName = analysis.languages?.includes('cpp') ? 'C++' : analysis.languages?.includes('rs') ? 'Rust' : 'Go';
    diagram += `    Input["📥 Command Line Args"]:::sysInputNode\n`;
    diagram += `    Compiler["🔨 Compiler/Runtime<br/>(${langName})"]:::compileNode\n`;
    diagram += `    subgraph Execution ["${langEmoji} Program Execution"]\n`;
    diagram += `        Memory["💾 Memory Management"]:::memNode\n`;
    diagram += `        Runtime["⚡ Runtime Logic"]:::runtimeNode\n`;
    diagram += `    end\n`;
    diagram += `    Output["📤 Output"]:::sysOutputNode\n`;
    diagram += `\n    Input -->|Code| Compiler\n`;
    diagram += `    Compiler -->|Execute| Memory\n`;
    diagram += `    Memory -->|Manage| Runtime\n`;
    diagram += `    Runtime -->|Results| Output\n`;
    diagram += `\n    classDef sysInputNode fill:#1a1a2e,stroke:#eb5757,stroke-width:3px,color:#ff6b6b,font-weight:bold\n`;
    diagram += `    classDef compileNode fill:#16213e,stroke:#eb5757,stroke-width:2px,color:#ff6b6b\n`;
    diagram += `    classDef memNode fill:#0f3460,stroke:#f39c12,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef runtimeNode fill:#0f3460,stroke:#f39c12,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef sysOutputNode fill:#16213e,stroke:#eb5757,stroke-width:3px,color:#ff6b6b,font-weight:bold\n`;
    diagram += `    classDef Execution fill:#1a1a2e,stroke:#eb5757,stroke-width:2px\n`;
    return diagram;
  }

  // Python Scripts - Interpreted Style
  if (analysis.isPython) {
    diagram += `    Input["📥 Input/Arguments"]:::pythonInputNode\n`;
    diagram += `    Interpreter["🐍 Python Interpreter"]:::interpreterNode\n`;
    diagram += `    subgraph Runtime ["▶️ Script Execution"]\n`;
    diagram += `        Modules["📦 Modules/Libraries"]:::moduleNode\n`;
    diagram += `        Functions["🔧 Functions"]:::funcNode\n`;
    diagram += `    end\n`;
    diagram += `    Output["📤 Output/Results"]:::pythonOutputNode\n`;
    diagram += `\n    Input -->|Script| Interpreter\n`;
    diagram += `    Interpreter -->|Load| Modules\n`;
    diagram += `    Modules -->|Execute| Functions\n`;
    diagram += `    Functions -->|Return| Output\n`;
    diagram += `\n    classDef pythonInputNode fill:#1a1a2e,stroke:#3776ab,stroke-width:3px,color:#3776ab,font-weight:bold\n`;
    diagram += `    classDef interpreterNode fill:#0f3460,stroke:#3776ab,stroke-width:2px,color:#3776ab,font-weight:bold\n`;
    diagram += `    classDef moduleNode fill:#16213e,stroke:#ffd700,stroke-width:2px,color:#ffd700\n`;
    diagram += `    classDef funcNode fill:#16213e,stroke:#ffd700,stroke-width:2px,color:#ffd700\n`;
    diagram += `    classDef pythonOutputNode fill:#0f3460,stroke:#3776ab,stroke-width:3px,color:#3776ab,font-weight:bold\n`;
    diagram += `    classDef Runtime fill:#1a1a2e,stroke:#3776ab,stroke-width:2px\n`;
    return diagram;
  }

  // Generic CLI utility - fallback for unidentified utilities
  if (analysis.isUtility) {
    diagram += `    User["👤 User"]:::userNode\n`;
    diagram += `    CLI["🖥️ ${analysis.projectType}<br/>${analysis.repoName}"]:::cliNode\n`;
    diagram += `    Logic["⚙️ Logic<br/>(${analysis.services.length} ${analysis.services.length === 1 ? 'module' : 'modules'})"]:::logicNode\n`;
    
    if (analysis.database.type) {
      diagram += `    DB["💾 ${analysis.database.type}"]:::dbNode\n`;
      diagram += `    User -->|Input| CLI\n`;
      diagram += `    CLI --> Logic\n`;
      diagram += `    Logic -->|Read/Write| DB\n`;
      diagram += `    DB -->|Data| Logic\n`;
      diagram += `    Logic -->|Output| User\n`;
    } else {
      diagram += `    User -->|Input| CLI\n`;
      diagram += `    CLI --> Logic\n`;
      diagram += `    Logic -->|Output| User\n`;
    }
    
    diagram += `\n    classDef userNode fill:#1f2937,stroke:#3b82f6,stroke-width:3px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef cliNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef logicNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef dbNode fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n`;
    
    return diagram;
  }

  // VARIED STYLE 2: Frontend-Heavy Apps (SPA)
  if (analysis.frontend.framework && !analysis.database.models?.length) {
    diagram += `    User["👤 Users"]:::userNode\n`;
    diagram += `    Browser["🌐 Browser"]:::browserNode\n`;
    diagram += `    subgraph SPA ["💻 Single Page Application (${analysis.frontend.framework})"]\n`;
    diagram += `        Components["🧩 Components<br/>(${analysis.frontend.components?.length || 0} files)"]:::componentNode\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `        State["🔄 ${analysis.frontend.stateManagement}<br/>State Management"]:::stateNode\n`;
    }
    diagram += `        Build["📦 Build Output<br/>(Bundled Assets)"]:::buildNode\n`;
    diagram += `    end\n`;
    
    if (analysis.apiEndpoints?.length) {
      diagram += `    API["🌍 External API<br/>(${analysis.apiEndpoints.length} endpoints)"]:::apiNode\n`;
      diagram += `    User -->|Opens URL| Browser\n`;
      diagram += `    Browser -->|Loads| SPA\n`;
      diagram += `    Components -->|Uses| State\n`;
      diagram += `    State -->|Updates UI| Components\n`;
      diagram += `    Components -->|Calls| API\n`;
      diagram += `    API -->|JSON| Components\n`;
      diagram += `    SPA -->|Renders| Browser\n`;
      diagram += `    Browser -->|Displays| User\n`;
    } else {
      diagram += `    User -->|Interact| SPA\n`;
      diagram += `    Components -->|Uses| State\n`;
      diagram += `    State -->|Updates| Components\n`;
      diagram += `    SPA -->|Render| Browser\n`;
      diagram += `    Browser -->|Display| User\n`;
    }
    
    diagram += `\n    classDef userNode fill:#1e293b,stroke:#3b82f6,stroke-width:3px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef browserNode fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef componentNode fill:#134e4a,stroke:#14b8a6,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef stateNode fill:#5b21b6,stroke:#a855f7,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef buildNode fill:#292524,stroke:#ea580c,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef apiNode fill:#0c4a6e,stroke:#0284c7,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef SPA fill:#1f2937,stroke:#4f46e5,stroke-width:3px\n`;
    
    return diagram;
  }

  // VARIED STYLE 3: REST API Backend
  if (!analysis.frontend.framework && analysis.database.models?.length > 0) {
    diagram += `    Clients["📱 Client Apps"]:::clientNode\n`;
    diagram += `    Mobile["📲 Mobile Client"]:::mobileNode\n`;
    diagram += `    Web["🌐 Web Client"]:::webNode\n`;
    diagram += `    subgraph REST ["🔌 REST API (${analysis.backend.framework || 'Server'})"]\n`;
    diagram += `        Routes["📍 Routes<br/>(${analysis.apiEndpoints?.length || 0} endpoints)"]:::routeNode\n`;
    if (analysis.backend.services.length > 0) {
      diagram += `        Services["💼 Services<br/>(${analysis.backend.services.length} files)"]:::serviceNode\n`;
    }
    diagram += `    end\n`;
    diagram += `    subgraph DB ["💾 Data Store (${analysis.database.type})"]\n`;
    diagram += `        Database["${analysis.database.type}"]:::databaseNode\n`;
    diagram += `        Models["📊 Models<br/>(${analysis.database.models.length})"]:::modelNode\n`;
    diagram += `    end\n`;
    
    diagram += `    Mobile -->|HTTP/REST| Routes\n`;
    diagram += `    Web -->|HTTP/REST| Routes\n`;
    if (analysis.backend.services.length > 0) {
      diagram += `    Routes --> Services\n`;
      diagram += `    Services -->|Query| Database\n`;
    } else {
      diagram += `    Routes -->|Query| Database\n`;
    }
    diagram += `    Database --> Models\n`;
    diagram += `    Database -->|Results| REST\n`;
    diagram += `    REST -->|JSON Response| Mobile\n`;
    diagram += `    REST -->|JSON Response| Web\n`;
    
    diagram += `\n    classDef clientNode fill:#1e3a8a,stroke:#2563eb,stroke-width:3px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef mobileNode fill:#172554,stroke:#0ea5e9,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef webNode fill:#172554,stroke:#0ea5e9,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef routeNode fill:#7c2d12,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef serviceNode fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef databaseNode fill:#6b21a8,stroke:#d946ef,stroke-width:3px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef modelNode fill:#5b21b6,stroke:#a855f7,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef REST fill:#1f2937,stroke:#f59e0b,stroke-width:2px\n`;
    diagram += `    classDef DB fill:#1f2937,stroke:#d946ef,stroke-width:2px\n`;
    
    return diagram;
  }

  // VARIED STYLE 4: Complex Full-Stack Enterprise
  diagram += `    User["👤 Users"]:::userNode\n`;
  diagram += `    subgraph CDN ["🌍 CDN Layer"]\n`;
  diagram += `        StaticAssets["📦 Static Assets"]:::assetNode\n`;
  diagram += `    end\n`;

  // Frontend layer
  if (analysis.frontend.framework) {
    diagram += `    subgraph Frontend ["📱 Frontend (${analysis.frontend.framework})<br/>${analysis.frontend.components.length} Components"]\n`;
    diagram += `        UI["🎨 UI Components"]:::uiNode\n`;
    
    if (analysis.frontend.stateManagement) {
      diagram += `        State["🔄 ${analysis.frontend.stateManagement}"]:::stateNode\n`;
      diagram += `        UI --> State\n`;
    }
    diagram += `    end\n`;
  }

  // Backend layer
  diagram += `    subgraph Backend ["⚙️ Backend (${analysis.backend.framework || 'Server'})<br/>${analysis.apiEndpoints?.length || 0} Endpoints"]\n`;
  
  if (analysis.backend.routes.length > 0) {
    diagram += `        Router["📍 Router/Handler"]:::routerNode\n`;
  }

  if (analysis.backend.middleware.length > 0) {
    diagram += `        MW["🛡️ Middleware"]:::mwNode\n`;
  }

  if (analysis.backend.services.length > 0) {
    const topSvc = analysis.backend.services[0].name?.replace('.ts', '').substring(0, 15) || 'Service';
    diagram += `        Services["💼 Services<br/>(${analysis.backend.services.length})"]:::serviceNode\n`;
  }

  diagram += `    end\n`;

  // Database layer
  if (analysis.database.type) {
    diagram += `    subgraph Data ["💾 Data Layer (${analysis.database.type})<br/>${analysis.database.models.length} Models"]\n`;
    diagram += `        DB["🗄️ Database"]:::dbNode\n`;
    if (analysis.database.models.length > 0) {
      diagram += `        Cache["⚡ Cache"]:::cacheNode\n`;
    }
    diagram += `    end\n`;
  }

  // Connections
  diagram += `\n    User -->|HTTPS| StaticAssets\n`;
  if (analysis.frontend.framework) {
    diagram += `    User -->|Interact| UI\n`;
    if (analysis.backend.routes.length > 0) {
      diagram += `    UI -->|API Calls| Router\n`;
    } else {
      diagram += `    UI -->|API Calls| Backend\n`;
    }
  } else {
    if (analysis.backend.routes.length > 0) {
      diagram += `    User -->|HTTP| Router\n`;
    } else {
      diagram += `    User -->|HTTP| Backend\n`;
    }
  }

  if (analysis.backend.routes.length > 0) {
    if (analysis.backend.middleware.length > 0) {
      diagram += `    Router --> MW\n`;
      if (analysis.backend.services.length > 0) {
        diagram += `    MW --> Services\n`;
      } else if (analysis.database.type) {
        diagram += `    MW --> DB\n`;
      }
    } else if (analysis.backend.services.length > 0) {
      diagram += `    Router --> Services\n`;
    } else if (analysis.database.type) {
      diagram += `    Router --> DB\n`;
    }
  }

  if (analysis.backend.services.length > 0 && analysis.database.type) {
    diagram += `    Services -->|Query| DB\n`;
    if (analysis.database.models.length > 0) {
      diagram += `    Services -.->|Cache| Cache\n`;
    }
  }

  // Styling
  diagram += `\n    classDef userNode fill:#1e1b4b,stroke:#4f46e5,stroke-width:3px,color:#fff,font-weight:bold\n`;
  diagram += `    classDef assetNode fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef uiNode fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef stateNode fill:#581c87,stroke:#d946ef,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef routerNode fill:#92400e,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef mwNode fill:#16a34a,stroke:#22c55e,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef serviceNode fill:#7c2d12,stroke:#ea580c,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef dbNode fill:#701c1c,stroke:#dc2626,stroke-width:3px,color:#fff,font-weight:bold\n`;
  diagram += `    classDef cacheNode fill:#164e63,stroke:#0ea5e9,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef Frontend fill:#1e293b,stroke:#0ea5e9,stroke-width:2px\n`;
  diagram += `    classDef Backend fill:#1f2937,stroke:#f59e0b,stroke-width:2px\n`;
  diagram += `    classDef Data fill:#1f1f2e,stroke:#dc2626,stroke-width:2px\n`;
  diagram += `    classDef CDN fill:#0f172a,stroke:#06b6d4,stroke-width:2px\n`;

  return diagram;
}

function generateAdvancedLLD(analysis: any): string {
  // COBOL Style - Procedural flow
  if (analysis.isCobol) {
    let diagram = `graph TD\n`;
    const procedures = analysis.cobolProcedures?.[0]?.procedures || [];
    diagram += `    Input["📥 ACCEPT Input"]:::inputStyle\n`;
    diagram += `    Main["MAIN-PROCEDURE"]:::mainStyle\n`;
    
    if (procedures.length > 0) {
      diagram += `    Proc1["PERFORM ${procedures[0] || 'PROCESS'}"]:::procStyle\n`;
      if (procedures.length > 1) {
        diagram += `    Proc2["PERFORM ${procedures[1] || 'CALCULATE'}"]:::procStyle\n`;
      }
    } else {
      diagram += `    Process["Process Data"]:::procStyle\n`;
    }
    
    diagram += `    Output["📤 DISPLAY Output"]:::outputStyle\n`;
    diagram += `\n    Input --> Main\n`;
    diagram += `    Main --> Proc1\n`;
    if (procedures.length > 1) {
      diagram += `    Proc1 --> Proc2\n`;
      diagram += `    Proc2 --> Output\n`;
    } else if (procedures.length > 0) {
      diagram += `    Proc1 --> Output\n`;
    } else {
      diagram += `    Main --> Process\n`;
      diagram += `    Process --> Output\n`;
    }
    
    diagram += `\n    classDef inputStyle fill:#001f3f,stroke:#00ffff,stroke-width:2px,color:#00ffff\n`;
    diagram += `    classDef mainStyle fill:#003d7a,stroke:#00bfff,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef procStyle fill:#0055cc,stroke:#1e90ff,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef outputStyle fill:#001a4d,stroke:#00ffff,stroke-width:2px,color:#00ffff\n`;
    return diagram;
  }

  // Java Style - OOP flow
  if (analysis.isJava) {
    let diagram = `graph TD\n`;
    diagram += `    Input["📥 Input Arguments"]:::inputStyle\n`;
    diagram += `    Main["Main(String[] args)"]:::mainStyle\n`;
    diagram += `    Constructor["📦 Object Constructor"]:::constructStyle\n`;
    diagram += `    Methods["🔧 Class Methods"]:::methodStyle\n`;
    diagram += `    Output["📤 Output Result"]:::outputStyle\n`;
    
    diagram += `\n    Input --> Main\n`;
    diagram += `    Main --> Constructor\n`;
    diagram += `    Constructor --> Methods\n`;
    diagram += `    Methods --> Output\n`;
    
    diagram += `\n    classDef inputStyle fill:#2c2c2c,stroke:#ff8a00,stroke-width:2px,color:#ff8a00\n`;
    diagram += `    classDef mainStyle fill:#1a1a1a,stroke:#ff8a00,stroke-width:2px,color:#ff8a00,font-weight:bold\n`;
    diagram += `    classDef constructStyle fill:#4a4a4a,stroke:#ffaa33,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef methodStyle fill:#2a2a2a,stroke:#ffcc33,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef outputStyle fill:#1a1a1a,stroke:#ff8a00,stroke-width:2px,color:#ff8a00,font-weight:bold\n`;
    return diagram;
  }

  // C++/Rust/Go Style - Systems programming
  if (analysis.isSystems) {
    let diagram = `graph TD\n`;
    const langName = analysis.languages?.includes('cpp') ? 'C++' : analysis.languages?.includes('rs') ? 'Rust' : 'Go';
    diagram += `    Input["📥 Command Args"]:::inputStyle\n`;
    diagram += `    Main["fn main()"]:::mainStyle\n`;
    diagram += `    Modules["🔧 Helper Functions"]:::moduleStyle\n`;
    diagram += `    Output["📤 stdout/File Output"]:::outputStyle\n`;
    
    diagram += `\n    Input --> Main\n`;
    diagram += `    Main --> Modules\n`;
    diagram += `    Modules --> Output\n`;
    
    diagram += `\n    classDef inputStyle fill:#1a1a2e,stroke:#eb5757,stroke-width:2px,color:#ff6b6b\n`;
    diagram += `    classDef mainStyle fill:#16213e,stroke:#eb5757,stroke-width:2px,color:#ff6b6b,font-weight:bold\n`;
    diagram += `    classDef moduleStyle fill:#0f3460,stroke:#f39c12,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef outputStyle fill:#16213e,stroke:#eb5757,stroke-width:2px,color:#ff6b6b,font-weight:bold\n`;
    return diagram;
  }

  // Python Style - Script execution
  if (analysis.isPython) {
    let diagram = `graph TD\n`;
    diagram += `    Input["📥 Arguments"]:::inputStyle\n`;
    diagram += `    Parse["🔍 Parse Input"]:::parseStyle\n`;
    diagram += `    Execute["▶️ Execute Logic"]:::execStyle\n`;
    diagram += `    Output["📤 Print/Return"]:::outputStyle\n`;
    
    diagram += `\n    Input --> Parse\n`;
    diagram += `    Parse --> Execute\n`;
    diagram += `    Execute --> Output\n`;
    
    diagram += `\n    classDef inputStyle fill:#1a1a2e,stroke:#3776ab,stroke-width:2px,color:#3776ab\n`;
    diagram += `    classDef parseStyle fill:#0f3460,stroke:#ffd700,stroke-width:2px,color:#ffd700\n`;
    diagram += `    classDef execStyle fill:#16213e,stroke:#ffd700,stroke-width:2px,color:#ffd700\n`;
    diagram += `    classDef outputStyle fill:#0f3460,stroke:#3776ab,stroke-width:2px,color:#3776ab,font-weight:bold\n`;
    return diagram;
  }

  // Choose diagram layout style based on repo characteristics
  const hasServices = analysis.backend.services && analysis.backend.services.length > 0;
  const hasModels = analysis.database.models && analysis.database.models.length > 0;
  const complexAPI = analysis.apiEndpoints && analysis.apiEndpoints.length > 6;

  // Generic CLI/Utilities style (fallback)
  if (analysis.isUtility) {
    let diagram = `graph TD\n`;
    diagram += `    %% ${analysis.repoName} - Low-Level Detail\n`;
    diagram += `    User["👤 User"]:::userStyle\n`;
    diagram += `    Main["🎯 Main Entry"]:::mainStyle\n`;
    diagram += `    Logic["⚙️ Core Logic"]:::logicStyle\n`;
    if (analysis.database.type) {
      diagram += `    DB["💾 ${analysis.database.type}"]:::dbStyle\n`;
      diagram += `    User --> Main --> Logic --> DB --> Logic --> User\n`;
    } else {
      diagram += `    User --> Main --> Logic --> User\n`;
    }
    diagram += `\n    classDef userStyle fill:#1e3a8a,stroke:#3b82f6,stroke-width:3px,color:#fff\n`;
    diagram += `    classDef mainStyle fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef logicStyle fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef dbStyle fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n`;
    return diagram;
  }

  // STYLE 2: Layered horizontal flow for complex APIs
  if (complexAPI && hasServices && hasModels) {
    let diagram = `graph LR\n`;
    diagram += `    %% ${analysis.repoName} - Layered Architecture\n`;
    diagram += `    Client["📱 Clients"]:::clientStyle\n`;

    // Request layer
    diagram += `    subgraph REQ ["🔌 API Layer"]\n`;
    const endpoints = analysis.apiEndpoints.slice(0, 4);
    endpoints.forEach((ep: any, idx: number) => {
      const method = ep.method || 'GET';
      const shortPath = ep.path?.substring(0, 15) || `ep${idx}`;
      diagram += `        EP${idx}["${method} ${shortPath}"]:::epStyle\n`;
    });
    diagram += `    end\n`;

    // Business logic layer
    diagram += `    subgraph BIZ ["💼 Business Logic"]\n`;
    const services = analysis.backend.services.slice(0, 3);
    services.forEach((svc: any, idx: number) => {
      const name = svc.name?.replace('.ts', '').substring(0, 12) || `Svc${idx}`;
      diagram += `        S${idx}["${name}"]:::svcStyle\n`;
    });
    diagram += `    end\n`;

    // Data layer
    diagram += `    subgraph DATA ["💾 Data Access"]\n`;
    const models = analysis.database.models.slice(0, 3);
    models.forEach((model: any, idx: number) => {
      diagram += `        M${idx}["${model.name}"]:::modelStyle\n`;
    });
    diagram += `    end\n`;

    diagram += `    DB["${analysis.database.type}"]:::dbStyle\n`;

    // Connections
    diagram += `    Client -->|HTTP| EP0\n`;
    endpoints.forEach((ep: any, idx: number) => {
      diagram += `    EP${idx} --> S${idx % services.length}\n`;
    });
    services.forEach((svc: any, idx: number) => {
      diagram += `    S${idx} --> M${idx % models.length}\n`;
    });
    models.forEach((model: any, idx: number) => {
      diagram += `    M${idx} --> DB\n`;
    });

    diagram += `\n    classDef clientStyle fill:#0f172a,stroke:#3b82f6,stroke-width:3px,color:#fff,font-weight:bold\n`;
    diagram += `    classDef epStyle fill:#92400e,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef svcStyle fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef modelStyle fill:#5b21b6,stroke:#a855f7,stroke-width:2px,color:#fff\n`;
    diagram += `    classDef dbStyle fill:#701c1c,stroke:#dc2626,stroke-width:3px,color:#fff\n`;
    diagram += `    classDef REQ fill:#1f2937,stroke:#f59e0b,stroke-width:2px\n`;
    diagram += `    classDef BIZ fill:#1f2937,stroke:#10b981,stroke-width:2px\n`;
    diagram += `    classDef DATA fill:#1f2937,stroke:#a855f7,stroke-width:2px\n`;

    return diagram;
  }

  // STYLE 3: Simplified vertical flow
  let diagram = `graph TD\n`;
  diagram += `    %% ${analysis.repoName} - Component Interactions\n`;
  diagram += `    Client["📱 Client<br/>Request"]:::clientStyle\n`;

  // Endpoints
  if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
    const getEp = analysis.apiEndpoints.find((e: any) => e.method === 'GET');
    const postEp = analysis.apiEndpoints.find((e: any) => e.method === 'POST');
    
    if (getEp) {
      diagram += `    GET["📍 ${getEp.method} ${getEp.path}"]:::getStyle\n`;
    }
    if (postEp) {
      diagram += `    POST["📍 ${postEp.method} ${postEp.path}"]:::postStyle\n`;
    }

    diagram += `    Client -->|Route| GET\n`;
    if (postEp) diagram += `    Client -->|Route| POST\n`;
  }

  // Services
  if (hasServices) {
    const topSvc = analysis.backend.services[0];
    const svcName = topSvc.name?.replace('.ts', '').substring(0, 15) || 'Service';
    diagram += `    Service["💼 ${svcName}"]:::svcStyle\n`;
    
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      diagram += `    GET -->|Call| Service\n`;
    }
  }

  // Models
  if (hasModels) {
    const topModel = analysis.database.models[0];
    diagram += `    Model["📊 ${topModel.name}"]:::modelStyle\n`;
    
    if (hasServices) {
      diagram += `    Service -->|Query| Model\n`;
    } else if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      diagram += `    GET -->|Query| Model\n`;
    }
  }

  // Database
  if (analysis.database.type) {
    diagram += `    DB["💾 ${analysis.database.type}"]:::dbStyle\n`;
    
    if (hasModels) {
      diagram += `    Model -->|Persist| DB\n`;
      diagram += `    DB -->|Results| Model\n`;
    } else if (hasServices) {
      diagram += `    Service -->|Persist| DB\n`;
    } else {
      diagram += `    Client -->|Query| DB\n`;
    }
  }

  // Response
  diagram += `    Response["✓ Response<br/>JSON"]:::responseStyle\n`;
  if (hasServices) {
    diagram += `    Service -->|Return| Response\n`;
  } else if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
    diagram += `    GET -->|Return| Response\n`;
  } else {
    diagram += `    DB -->|Data| Response\n`;
  }
  diagram += `    Response -->|Send| Client\n`;

  // Styling
  diagram += `\n    classDef clientStyle fill:#0f172a,stroke:#3b82f6,stroke-width:3px,color:#fff,font-weight:bold\n`;
  diagram += `    classDef getStyle fill:#7c2d12,stroke:#f59e0b,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef postStyle fill:#3730a3,stroke:#6366f1,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef svcStyle fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef modelStyle fill:#581c87,stroke:#d946ef,stroke-width:2px,color:#fff\n`;
  diagram += `    classDef dbStyle fill:#701c1c,stroke:#dc2626,stroke-width:3px,color:#fff\n`;
  diagram += `    classDef responseStyle fill:#164e63,stroke:#0ea5e9,stroke-width:2px,color:#fff\n`;

  return diagram;
}

function generateAdvancedDatabaseSchema(analysis: any): string {
  // Handle single-language utilities - no database schema needed
  if (analysis.isCobol || analysis.isJava || analysis.isSystems || analysis.isPython) {
    const reason = analysis.isCobol ? 'COBOL procedural program' : 
                  analysis.isJava ? 'Java utility application' :
                  analysis.isSystems ? 'Systems programming (standalone)' :
                  'Python script';
    return `graph LR\n    Info["🔹 ${reason}<br/>No Persistent Database"]:::info\n    classDef info fill:#4a5568,stroke:#a0aec0,stroke-width:2px,color:#e2e8f0,text-align:center`;
  }

  // If no database or models, show "no database"
  if (analysis.isUtility || (!analysis.database.type && (!analysis.database.models || analysis.database.models.length === 0))) {
    return `graph LR\n    NoDB["❌ No Database<br/>Utility/Standalone"]:::nodb\n    classDef nodb fill:#7f1d1d,stroke:#dc2626,stroke-width:3px,color:#fff,font-weight:bold`;
  }

  // STYLE 1: Simple models - Basic table view
  if (!analysis.database.models || analysis.database.models.length <= 2) {
    let diagram = `erDiagram\n`;
    diagram += `    %% ${analysis.repoName} - Simple Schema\n`;
    diagram += `    %% ${analysis.database.type} (${analysis.database.models?.length || 0} models)\n\n`;

    if (analysis.database.models && analysis.database.models.length > 0) {
      analysis.database.models.forEach((model: any) => {
        const name = model.name.toUpperCase();
        diagram += `    ${name} {\n`;
        diagram += `        string id PK\n`;
        
        if (model.fields && model.fields.length > 0) {
          model.fields.slice(0, 5).forEach((field: any) => {
            diagram += `        ${field.type || 'string'} ${field.name}\n`;
          });
        } else {
          diagram += `        string name\n`;
          diagram += `        timestamp createdAt\n`;
          diagram += `        timestamp updatedAt\n`;
        }
        diagram += `    }\n\n`;
      });
    }

    return diagram;
  }

  // STYLE 2: Complex multi-model ER diagram
  let diagram = `erDiagram\n`;
  diagram += `    %% ${analysis.repoName} - Database Schema\n`;
  diagram += `    %% ${analysis.database.type} | ${analysis.database.models.length} Models\n\n`;

  // Add all models
  analysis.database.models.forEach((model: any) => {
    const name = model.name.toUpperCase();
    diagram += `    ${name} {\n`;
    diagram += `        string id PK\n`;

    if (model.fields && model.fields.length > 0) {
      model.fields.forEach((field: any) => {
        // Handle both string and object field formats
        if (typeof field === 'object' && field.name) {
          const fieldType = field.type || 'string';
          diagram += `        ${fieldType} ${field.name}\n`;
        } else if (typeof field === 'string') {
          diagram += `        string ${field}\n`;
        }
      });
    } else {
      // Smart field generation based on model name
      if (name.includes('USER')) {
        diagram += `        string email UK\n`;
        diagram += `        string password\n`;
        diagram += `        string name\n`;
      } else if (name.includes('PRODUCT')) {
        diagram += `        string name\n`;
        diagram += `        decimal price\n`;
        diagram += `        int stock\n`;
      } else if (name.includes('ORDER')) {
        diagram += `        string userId FK\n`;
        diagram += `        decimal total\n`;
        diagram += `        string status\n`;
      } else if (name.includes('POST') || name.includes('ARTICLE')) {
        diagram += `        string title\n`;
        diagram += `        text content\n`;
        diagram += `        string userId FK\n`;
      } else {
        diagram += `        string name\n`;
      }
      diagram += `        timestamp createdAt\n`;
      diagram += `        timestamp updatedAt\n`;
    }
    diagram += `    }\n\n`;
  });

  // Auto-detect relationships
  const modelNames: string[] = (analysis.database.models as any[])
    .map((m: any) => String(m?.name || '').toUpperCase())
    .filter(Boolean);

  // User relationships
  const userModel = modelNames.find(n => n.includes('USER'));
  if (userModel) {
    const postModel = modelNames.find(n => (n.includes('POST') || n.includes('ARTICLE')) && n !== userModel);
    const orderModel = modelNames.find(n => n.includes('ORDER') && n !== userModel);
    const commentModel = modelNames.find(n => n.includes('COMMENT') && n !== userModel);
    const profileModel = modelNames.find(n => n.includes('PROFILE') && n !== userModel);

    if (postModel) diagram += `    ${userModel} ||--o{ ${postModel} : "writes"\n`;
    if (orderModel) diagram += `    ${userModel} ||--o{ ${orderModel} : "places"\n`;
    if (commentModel) diagram += `    ${userModel} ||--o{ ${commentModel} : "makes"\n`;
    if (profileModel) diagram += `    ${userModel} ||--|| ${profileModel} : "has"\n`;
  }

  // Product relationships
  const productModel = modelNames.find(n => n.includes('PRODUCT'));
  if (productModel) {
    const categoryModel = modelNames.find(n => n.includes('CATEGORY'));
    const reviewModel = modelNames.find(n => n.includes('REVIEW'));
    
    if (categoryModel) diagram += `    ${categoryModel} ||--o{ ${productModel} : "groups"\n`;
    if (reviewModel) diagram += `    ${productModel} ||--o{ ${reviewModel} : "has"\n`;
  }

  // Order relationships
  const orderModel = modelNames.find(n => n.includes('ORDER') && !n.includes('ORDERITEM'));
  if (orderModel) {
    const orderItemModel = modelNames.find(n => n.includes('ORDERITEM'));
    const productModel = modelNames.find(n => n.includes('PRODUCT'));
    
    if (orderItemModel) {
      diagram += `    ${orderModel} ||--o{ ${orderItemModel} : "contains"\n`;
      if (productModel) {
        diagram += `    ${productModel} ||--o{ ${orderItemModel} : "in"\n`;
      }
    }
  }

  // Post/Article relationships
  const postModel = modelNames.find(n => n.includes('POST') || n.includes('ARTICLE'));
  if (postModel) {
    const tagModel = modelNames.find(n => n.includes('TAG'));
    const categoryModel = modelNames.find(n => n.includes('CATEGORY'));
    const commentModel = modelNames.find(n => n.includes('COMMENT'));
    
    if (tagModel) diagram += `    ${postModel} }o--o{ ${tagModel} : "tagged"\n`;
    if (categoryModel) diagram += `    ${categoryModel} ||--o{ ${postModel} : "contains"\n`;
    if (commentModel) diagram += `    ${postModel} ||--o{ ${commentModel} : "has"\n`;
  }

  return diagram;
}

function generateAdvancedSequenceDiagram(analysis: any): string {
  let diagram = `sequenceDiagram\n`;
  diagram += `    %% ${analysis.repoName} - Request/Response Flow\n`;

  // COBOL Applications - ACCEPT/PROCESS/DISPLAY flow
  if (analysis.isCobol) {
    const procedures = analysis.cobolProcedures?.[0]?.procedures || [];
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant Cobol as 🔧 COBOL Program\n`;
    if (procedures.length > 0) {
      diagram += `    participant Proc1 as 📋 ${procedures[0] || 'PROCEDURE'}\n`;
    }
    if (procedures.length > 1) {
      diagram += `    participant Proc2 as 📋 ${procedures[1] || 'PROCEDURE'}\n`;
    }
    
    diagram += `\n    autonumber\n`;
    diagram += `    User->>+Cobol: Input Data\n`;
    diagram += `    Cobol->>+Cobol: ACCEPT Input\n`;
    
    if (procedures.length > 0) {
      diagram += `    Cobol->>+Proc1: PERFORM\n`;
      if (procedures.length > 1) {
        diagram += `    Proc1->>+Proc2: PERFORM\n`;
        diagram += `    Proc2-->>-Proc1: Result\n`;
        diagram += `    Proc1-->>-Cobol: Result\n`;
      } else {
        diagram += `    Proc1-->>-Cobol: Result\n`;
      }
    }
    
    diagram += `    Cobol->>Cobol: DISPLAY Output\n`;
    diagram += `    Cobol-->>-User: Output Data\n`;
    return diagram;
  }

  // Java Applications - OOP object instantiation flow
  if (analysis.isJava) {
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant JVM as ☕ JVM\n`;
    diagram += `    participant Main as 🎯 Main Class\n`;
    diagram += `    participant Object as 📦 Object Instance\n`;
    
    diagram += `\n    autonumber\n`;
    diagram += `    User->>+JVM: Execute Program\n`;
    diagram += `    JVM->>+Main: Call main(args[])\n`;
    diagram += `    Main->>+Object: new Constructor()\n`;
    diagram += `    Object-->>-Main: Instance Created\n`;
    diagram += `    Main->>+Object: invoke Method()\n`;
    diagram += `    Object-->>-Main: Return Result\n`;
    diagram += `    Main-->>-JVM: Exit(status)\n`;
    diagram += `    JVM-->>-User: Program Output\n`;
    return diagram;
  }

  // Systems Languages (C++/Rust/Go) - Compilation and execution
  if (analysis.isSystems) {
    const langEmoji = analysis.languages?.includes('cpp') ? '⚙️' : analysis.languages?.includes('rs') ? '🦀' : '🐹';
    const langName = analysis.languages?.includes('cpp') ? 'C++' : analysis.languages?.includes('rs') ? 'Rust' : 'Go';
    
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant Compiler as 🔨 ${langName} Compiler\n`;
    diagram += `    participant Binary as 📦 Binary/Executable\n`;
    diagram += `    participant Runtime as ⚡ Runtime\n`;
    
    diagram += `\n    autonumber\n`;
    diagram += `    User->>+Compiler: Compile Code\n`;
    diagram += `    Compiler->>+Compiler: Type Check & Optimize\n`;
    diagram += `    Compiler-->>-Binary: Generate Binary\n`;
    diagram += `    User->>+Binary: Execute Program\n`;
    diagram += `    Binary->>+Runtime: Load Runtime\n`;
    diagram += `    Runtime->>+Runtime: Allocate Memory\n`;
    diagram += `    Runtime-->>-Runtime: Execute Logic\n`;
    diagram += `    Runtime-->>-Binary: Complete\n`;
    diagram += `    Binary-->>-User: Program Output\n`;
    return diagram;
  }

  // Python Scripts - Interpreted execution
  if (analysis.isPython) {
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant Interpreter as 🐍 Python Interpreter\n`;
    diagram += `    participant Parser as 🔍 AST Parser\n`;
    diagram += `    participant Executor as ▶️ Executor\n`;
    
    diagram += `\n    autonumber\n`;
    diagram += `    User->>+Interpreter: Execute Script\n`;
    diagram += `    Interpreter->>+Parser: Parse Script\n`;
    diagram += `    Parser-->>-Executor: AST\n`;
    diagram += `    Executor->>+Executor: Execute Operations\n`;
    diagram += `    Executor-->>-Interpreter: Result\n`;
    diagram += `    Interpreter-->>-User: Print Output\n`;
    return diagram;
  }

  // STYLE 1: Utility/CLI - Simple linear flow (fallback)
  if (analysis.isUtility) {
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant CLI as 🖥️ ${analysis.repoName}\n`;
    diagram += `    participant Logic as ⚙️ Logic\n`;
    if (analysis.database.type) {
      diagram += `    participant DB as 💾 ${analysis.database.type}\n`;
    }
    diagram += `\n    autonumber\n`;
    diagram += `    User->>+CLI: Execute\n`;
    diagram += `    CLI->>+Logic: Process\n`;
    if (analysis.database.type) {
      diagram += `    Logic->>+DB: Store\n`;
      diagram += `    DB-->>-Logic: OK\n`;
    }
    diagram += `    Logic-->>-CLI: Result\n`;
    diagram += `    CLI-->>-User: Output\n`;
    return diagram;
  }

  // STYLE 2: Frontend-centric - Browser/SPA focus
  if (analysis.frontend.framework && !analysis.database.models?.length) {
    diagram += `    actor User as 👤 User\n`;
    diagram += `    participant Browser as 🌐 Browser\n`;
    diagram += `    participant App as 📱 ${analysis.frontend.framework} App\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `    participant Store as 🔄 ${analysis.frontend.stateManagement}\n`;
    }
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      diagram += `    participant API as 🌍 Backend API\n`;
    }

    diagram += `\n    autonumber\n`;
    diagram += `    User->>+Browser: Navigate\n`;
    diagram += `    Browser->>+App: Load App\n`;
    if (analysis.frontend.stateManagement) {
      diagram += `    App->>+Store: Initialize\n`;
      diagram += `    Store-->>-App: State Ready\n`;
    }
    if (analysis.apiEndpoints && analysis.apiEndpoints.length > 0) {
      diagram += `    App->>+API: Fetch Data\n`;
      diagram += `    API-->>-App: JSON Response\n`;
      if (analysis.frontend.stateManagement) {
        diagram += `    App->>Store: Update State\n`;
      }
    }
    diagram += `    App-->>Browser: Render UI\n`;
    diagram += `    Browser-->>-User: Display Page ✓\n`;
    return diagram;
  }

  // STYLE 3: REST API - Backend centric with multiple client types
  if (!analysis.frontend.framework && analysis.database.models?.length > 0) {
    diagram += `    actor Mobile as 📲 Mobile Client\n`;
    diagram += `    actor Web as 🌐 Web Client\n`;
    diagram += `    participant API as ⚙️ API Server\n`;
    if (analysis.backend.services && analysis.backend.services.length > 0) {
      diagram += `    participant Service as 💼 Service\n`;
    }
    diagram += `    participant DB as 💾 ${analysis.database.type}\n`;

    diagram += `\n    autonumber\n\n`;
    diagram += `    Note over Mobile,DB: Fetch Data Request\n\n`;
    diagram += `    Mobile->>+API: GET /api/data\n`;
    if (analysis.backend.services && analysis.backend.services.length > 0) {
      diagram += `    API->>+Service: Query Data\n`;
      diagram += `    Service->>+DB: SELECT\n`;
      diagram += `    DB-->>-Service: Rows\n`;
      diagram += `    Service-->>-API: Processed Data\n`;
    } else {
      diagram += `    API->>+DB: Query\n`;
      diagram += `    DB-->>-API: Results\n`;
    }
    diagram += `    API-->>-Mobile: 200 OK + JSON\n`;

    diagram += `\n    rect rgb(100, 150, 200)\n`;
    diagram += `    Note over Web,DB: Create Resource\n`;
    diagram += `    Web->>+API: POST /api/create\n`;
    if (analysis.backend.services && analysis.backend.services.length > 0) {
      diagram += `    API->>+Service: Process\n`;
      diagram += `    Service->>+DB: INSERT\n`;
      diagram += `    DB-->>-Service: ID: 123\n`;
      diagram += `    Service-->>-API: Success\n`;
    } else {
      diagram += `    API->>+DB: INSERT\n`;
      diagram += `    DB-->>-API: Success\n`;
    }
    diagram += `    API-->>-Web: 201 Created\n`;
    diagram += `    end\n`;

    return diagram;
  }

  // STYLE 4: Complex Full-Stack - CDN, Middleware, all layers
  diagram += `    actor User as 👤 User\n`;
  diagram += `    participant Browser as 🌐 Browser\n`;
  if (analysis.frontend.framework) {
    diagram += `    participant FE as 📱 ${analysis.frontend.framework}\n`;
  }
  diagram += `    participant LoadBalancer as ⚖️ LB\n`;
  diagram += `    participant API as 🔌 API Gateway\n`;
  if (analysis.backend.services && analysis.backend.services.length > 0) {
    diagram += `    participant Service as 💼 Service Layer\n`;
  }
  if (analysis.database.type) {
    diagram += `    participant DB as 💾 ${analysis.database.type}\n`;
  }

  diagram += `\n    autonumber\n\n`;
  diagram += `    rect rgb(100, 180, 200)\n`;
  diagram += `    Note over User,DB: READ Operation\n`;
  diagram += `    User->>+Browser: Click Button\n`;
  if (analysis.frontend.framework) {
    diagram += `    Browser->>+FE: Trigger Event\n`;
    const getEndpoint = analysis.apiEndpoints?.find((e: any) => e.method === 'GET');
    const path = getEndpoint?.path || '/api/data';
    diagram += `    FE->>+LoadBalancer: GET ${path}\n`;
  } else {
    diagram += `    Browser->>+LoadBalancer: GET /api/data\n`;
  }
  diagram += `    LoadBalancer->>+API: Forward Request\n`;
  if (analysis.backend.services && analysis.backend.services.length > 0) {
    diagram += `    API->>+Service: Execute Handler\n`;
    if (analysis.database.type) {
      diagram += `    Service->>+DB: Query\n`;
      diagram += `    DB-->>-Service: Results\n`;
    }
    diagram += `    Service-->>-API: Processed Data\n`;
  } else if (analysis.database.type) {
    diagram += `    API->>+DB: Query\n`;
    diagram += `    DB-->>-API: Results\n`;
  }
  diagram += `    API-->>-LoadBalancer: 200 OK + JSON\n`;
  diagram += `    LoadBalancer-->>-Browser: Response\n`;
  if (analysis.frontend.framework) {
    diagram += `    FE-->>Browser: Update DOM\n`;
    diagram += `    Browser-->>-User: Display Data ✓\n`;
  } else {
    diagram += `    Browser-->>-User: Display Data ✓\n`;
  }
  diagram += `    end\n`;

  diagram += `\n    rect rgb(200, 150, 100)\n`;
  diagram += `    Note over User,DB: CREATE Operation\n`;
  const postEndpoint = analysis.apiEndpoints?.find((e: any) => e.method === 'POST');
  const postPath = postEndpoint?.path || '/api/create';
  diagram += `    User->>+Browser: Submit Form\n`;
  if (analysis.frontend.framework) {
    diagram += `    Browser->>+FE: Form Data\n`;
    diagram += `    FE->>FE: Validate Input\n`;
    diagram += `    FE->>+LoadBalancer: POST ${postPath}\n`;
  } else {
    diagram += `    Browser->>+LoadBalancer: POST ${postPath}\n`;
  }
  diagram += `    LoadBalancer->>+API: Forward Request\n`;
  if (analysis.backend.services && analysis.backend.services.length > 0) {
    diagram += `    API->>+Service: Process Request\n`;
    if (analysis.database.type) {
      diagram += `    Service->>+DB: INSERT\n`;
      diagram += `    DB-->>-Service: ID: 123\n`;
    }
    diagram += `    Service-->>-API: Created\n`;
  } else if (analysis.database.type) {
    diagram += `    API->>+DB: INSERT\n`;
    diagram += `    DB-->>-API: Success\n`;
  }
  diagram += `    API-->>-LoadBalancer: 201 Created\n`;
  diagram += `    LoadBalancer-->>-Browser: Success Response\n`;
  if (analysis.frontend.framework) {
    diagram += `    FE-->>Browser: Redirect/Update\n`;
    diagram += `    Browser-->>-User: Success Message ✓\n`;
  } else {
    diagram += `    Browser-->>-User: Success Message ✓\n`;
  }
  diagram += `    end\n`;

  return diagram;
}
