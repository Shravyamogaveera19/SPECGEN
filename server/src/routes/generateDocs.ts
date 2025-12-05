import { Router } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import Groq from "groq-sdk";

const execAsync = promisify(exec);
const router = Router();

interface RepoAnalysis {
  structure: { [key: string]: string[] };
  languages: { [key: string]: number };
  dependencies: string[];
  frameworks: string[];
  databases: string[];
  hasTests: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  readme?: string;
  packageFiles: string[];
}

// Initialize Groq client
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY not configured. Get your free key from https://console.groq.com/keys"
      );
    }
    groqClient = new Groq({ apiKey });
    console.log("✓ Groq client initialized");
  }
  return groqClient;
}

async function callGroq(prompt: string): Promise<string> {
  const client = getGroqClient();

  try {
    const message = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Current recommended model
      temperature: 0.7,
      max_tokens: 2000,
    });

    return (
      message.choices[0]?.message?.content || "Failed to generate documentation"
    );
  } catch (err: any) {
    console.error("Groq API error:", err);
    throw new Error(
      `Groq API error: ${err.message}. Make sure GROQ_API_KEY is set and has quota available.`
    );
  }
}

// POST /api/generate-docs { url, branch }
router.post("/", async (req, res) => {
  const { url, branch } = req.body;
  if (!url || typeof url !== "string") {
    return res
      .status(400)
      .json({ ok: false, reason: "Missing or invalid url field" });
  }

  const repoName = url.split("/").pop()?.replace(".git", "") || "repo";
  const tempDir = path.join(
    __dirname,
    "../../tmp",
    `${repoName}-${Date.now()}`
  );

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Clone repository
    const branchFlag = branch ? `-b ${branch}` : "";
    await execAsync(`git clone --depth=1 ${branchFlag} ${url} ${tempDir}`);

    // Analyze repository
    const analysis = await analyzeRepository(tempDir);

    // Generate SDLC documentation using Groq
    console.log("Generating documentation using Groq (Fast & Free)...");
    const docs = await generateDocsWithGroq(analysis, repoName, url);

    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    res.json({ ok: true, docs: { ...docs, analysis, repoName, repoUrl: url } });
  } catch (err: any) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.error("Error generating docs:", err);
    res.status(500).json({
      ok: false,
      reason: err.message || "Failed to generate documentation",
    });
  }
});

async function generateDocsWithGroq(
  analysis: RepoAnalysis,
  repoName: string,
  repoUrl: string
): Promise<{
  requirements: string;
  design: string;
  testPlan: string;
  deployment: string;
}> {
  const contextSummary = `
Repository: ${repoName}
URL: ${repoUrl}

**Technology Stack:**
- Languages: ${Object.keys(analysis.languages).join(", ") || "Unknown"}
- Frameworks: ${analysis.frameworks.join(", ") || "None detected"}
- Databases: ${analysis.databases.join(", ") || "None detected"}
- Has Tests: ${analysis.hasTests ? "Yes" : "No"}
- Has CI/CD: ${analysis.hasCI ? "Yes" : "No"}
- Has Docker: ${analysis.hasDocker ? "Yes" : "No"}
- Dependencies: ${analysis.dependencies.slice(0, 20).join(", ")}
${analysis.readme ? `\nREADME Preview:\n${analysis.readme}` : ""}
`;

  console.log("Generating 4 documentation sections in parallel...");

  try {
    const [requirements, design, testPlan, deployment] = await Promise.all([
      generateRequirementsWithGroq(contextSummary),
      generateDesignWithGroq(contextSummary),
      generateTestPlanWithGroq(contextSummary),
      generateDeploymentWithGroq(contextSummary),
    ]);

    return { requirements, design, testPlan, deployment };
  } catch (err: any) {
    throw new Error(
      `Documentation generation failed: ${err.message}. Check your Groq API quota at https://console.groq.com`
    );
  }
}

async function generateRequirementsWithGroq(context: string): Promise<string> {
  const prompt = `Based on this repository analysis, generate a comprehensive Software Requirements Specification (SRS) document in formal SRS format:

${context}

Please generate a professional SRS document with the following structure (use this exact format):

## 1. INTRODUCTION
### 1.1 Purpose
Write a brief description of the system's purpose and objectives.

### 1.2 Scope
Define what the system does and doesn't do.

### 1.3 Overview
Provide a high-level overview of the system functionality.

## 2. GENERAL DESCRIPTION
### 2.1 Product Perspective
Describe how this system relates to other systems if any.

### 2.2 Product Features
List major product features:
- Feature 1: Brief description
- Feature 2: Brief description
- (Continue as needed)

### 2.3 User Classes and Characteristics
Identify different user types and their characteristics.

### 2.4 Operating Environment
Describe the hardware and software environment.

## 3. SPECIFIC FUNCTIONAL REQUIREMENTS

### 3.1 [Feature/Module 1 Name]
**Requirement ID:** REQ-001
**Description:** Detailed description of this requirement
**Input:** What inputs are required
**Processing:** How the system processes the input
**Output:** Expected output
**Priority:** High/Medium/Low

### 3.2 [Feature/Module 2 Name]
**Requirement ID:** REQ-002
**Description:** Detailed description
**Input:** Expected inputs
**Processing:** Processing logic
**Output:** Expected output
**Priority:** High/Medium/Low

(Continue for all major features/requirements)

## 4. SYSTEM ARCHITECTURE
### 4.1 Technology Stack
- Backend: [List technologies]
- Frontend: [List technologies]
- Database: [List technologies]
- Other Tools: [List]

### 4.2 Data Flow
Brief description of how data flows through the system.

## 5. APPENDICES
### 5.1 Glossary
Define any technical terms used in the document.

Be specific, detailed, and use formal SRS language. Focus ONLY on functional requirements. Reference actual code patterns and features found in the repository.`;

  try {
    const result = await callGroq(prompt);
    return result.substring(0, 5000);
  } catch (err: any) {
    return `# Software Requirements Specification\n\nError: ${err.message}`;
  }
}

async function generateDesignWithGroq(context: string): Promise<string> {
  const prompt = `Based on this repository analysis, generate a comprehensive System Design & Architecture document:

${context}

Please generate a System Design document with:
1. Architecture Overview (2-3 paragraphs)
2. System Components and responsibilities (5-7 components)
3. Technology Stack explanation
4. Data Flow description
5. API Design principles
6. Database schema overview (if applicable)
7. Security Architecture

Format as markdown with clear sections. Keep response concise but complete.`;

  try {
    const result = await callGroq(prompt);
    return result.substring(0, 3000);
  } catch (err: any) {
    return `# System Design\n\nError: ${err.message}`;
  }
}

async function generateTestPlanWithGroq(context: string): Promise<string> {
  const prompt = `Based on this repository analysis, generate a Test Plan document:

${context}

Please generate a Test Plan with:
1. Testing Overview and Strategy (2-3 paragraphs)
2. Unit Testing approach
3. Integration Testing strategy
4. End-to-End Testing scenarios (3-5 examples)
5. Performance Testing requirements
6. Test Tools recommendations
7. Test Coverage targets

Format as markdown with clear sections. Keep response concise but complete.`;

  try {
    const result = await callGroq(prompt);
    return result.substring(0, 3000);
  } catch (err: any) {
    return `# Test Plan\n\nError: ${err.message}`;
  }
}

async function generateDeploymentWithGroq(context: string): Promise<string> {
  const prompt = `Based on this repository analysis, generate a Deployment & Operations Guide:

${context}

Please generate a Deployment Guide with:
1. Prerequisites and system requirements
2. Environment Configuration (example .env setup)
3. Installation Steps
4. Build Process
5. Deployment Options (development, production, cloud)
6. Post-Deployment Health Checks
7. Monitoring and Logging setup
8. Scaling Strategies
9. Troubleshooting

Format as markdown with clear sections and code examples. Keep response concise but complete.`;

  try {
    const result = await callGroq(prompt);
    return result.substring(0, 3000);
  } catch (err: any) {
    return `# Deployment Guide\n\nError: ${err.message}`;
  }
}

async function analyzeRepository(repoPath: string): Promise<RepoAnalysis> {
  const analysis: RepoAnalysis = {
    structure: {},
    languages: {},
    dependencies: [],
    frameworks: [],
    databases: [],
    hasTests: false,
    hasCI: false,
    hasDocker: false,
    packageFiles: [],
  };

  function scanDirectory(dir: string, relativePath = "") {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (
        item === ".git" ||
        item === "node_modules" ||
        item === ".venv" ||
        item === "__pycache__" ||
        item === ".next" ||
        item === "build" ||
        item === "dist"
      )
        continue;

      const fullPath = path.join(dir, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item === "test" || item === "tests" || item === "__tests__") {
          analysis.hasTests = true;
        }
        if (item === ".github" || item === ".gitlab-ci.yml") {
          analysis.hasCI = true;
        }
        scanDirectory(fullPath, relPath);
      } else {
        const ext = path.extname(item);
        const fileName = item.toLowerCase();

        if (ext) {
          analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
        }

        if (fileName === "dockerfile" || fileName.startsWith("dockerfile.")) {
          analysis.hasDocker = true;
        }

        if (
          fileName === ".travis.yml" ||
          fileName === "jenkinsfile" ||
          fileName === "azure-pipelines.yml" ||
          fileName.includes("github/workflows")
        ) {
          analysis.hasCI = true;
        }

        if (fileName === "package.json") {
          analysis.packageFiles.push(relPath);
          try {
            const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
            if (content.dependencies) {
              analysis.dependencies.push(...Object.keys(content.dependencies));
              if (content.dependencies.react) analysis.frameworks.push("React");
              if (content.dependencies.vue) analysis.frameworks.push("Vue");
              if (content.dependencies.angular)
                analysis.frameworks.push("Angular");
              if (content.dependencies.express)
                analysis.frameworks.push("Express");
              if (content.dependencies.fastify)
                analysis.frameworks.push("Fastify");
              if (content.dependencies.next)
                analysis.frameworks.push("Next.js");
              if (content.dependencies.mongoose)
                analysis.databases.push("MongoDB");
              if (content.dependencies.pg)
                analysis.databases.push("PostgreSQL");
              if (content.dependencies.mysql) analysis.databases.push("MySQL");
              if (content.dependencies.sqlite3)
                analysis.databases.push("SQLite");
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }

        if (fileName === "requirements.txt") {
          analysis.packageFiles.push(relPath);
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const deps = content
              .split("\n")
              .filter((l) => l && !l.startsWith("#"));
            analysis.dependencies.push(...deps);
            if (deps.some((d) => d.toLowerCase().includes("django")))
              analysis.frameworks.push("Django");
            if (deps.some((d) => d.toLowerCase().includes("flask")))
              analysis.frameworks.push("Flask");
            if (deps.some((d) => d.toLowerCase().includes("fastapi")))
              analysis.frameworks.push("FastAPI");
          } catch (e) {
            // Skip
          }
        }

        if (
          fileName === "readme.md" ||
          fileName === "readme.txt" ||
          fileName === "readme"
        ) {
          try {
            analysis.readme = fs
              .readFileSync(fullPath, "utf-8")
              .substring(0, 3000);
          } catch (e) {
            // Skip
          }
        }

        const dirName = path.dirname(relPath) || "root";
        if (!analysis.structure[dirName]) {
          analysis.structure[dirName] = [];
        }
        analysis.structure[dirName].push(item);
      }
    }
  }

  scanDirectory(repoPath);
  analysis.frameworks = [...new Set(analysis.frameworks)];
  analysis.databases = [...new Set(analysis.databases)];
  analysis.dependencies = [...new Set(analysis.dependencies)].slice(0, 50);

  return analysis;
}

export default router;
