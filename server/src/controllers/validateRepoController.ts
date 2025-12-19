import { Request, Response as ExpressResponse } from "express";

interface ValidationRequestBody {
  url?: string;
  branch?: string;
}

export async function validateRepo(req: Request, res: ExpressResponse) {
  const { url, branch } = req.body as ValidationRequestBody;
  if (!url || typeof url !== "string") {
    return res
      .status(400)
      .json({ ok: false, reason: "Missing or invalid url field" });
  }

  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return res
      .status(400)
      .json({ ok: false, reason: "Invalid GitHub repository URL format" });
  }
  const { owner, repo } = parsed;

  try {
    const repoResp = await ghGet(
      `https://api.github.com/repos/${owner}/${repo}`
    );
    if (repoResp.status === 404) {
      return res
        .status(404)
        .json({ ok: false, reason: "Repository not found", exists: false });
    }
    if (repoResp.status === 403) {
      return res
        .status(403)
        .json({
          ok: false,
          reason: "Access forbidden or rate limit exceeded",
          accessible: false,
        });
    }
    const repoData = (await repoResp.json()) as {
      default_branch?: string;
      [key: string]: any;
    };
    const defaultBranch: string =
      typeof repoData.default_branch === "string"
        ? repoData.default_branch
        : "main";
    const targetBranch = branch || defaultBranch;

    const branchesResp = await ghGet(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`
    );
    let branches: string[] = [];
    if (branchesResp.status === 200) {
      const branchData = await branchesResp.json();
      if (Array.isArray(branchData)) {
        branches = (branchData as any[])
          .map((b: any) => b.name)
          .filter((n: any) => typeof n === "string");
      }
    }

    if (branch) {
      if (!branches.includes(branch)) {
        return res.status(404).json({
          ok: false,
          reason: `Branch '${branch}' not found; default is '${defaultBranch}'`,
          exists: true,
          accessible: true,
          branches,
        });
      }
    }

    const codeAnalysis = await analyzeRepository(owner, repo, targetBranch);

    let exists = true;
    let accessible = true;
    let reason: string | undefined;

    if (!codeAnalysis.accessible) {
      accessible = false;
      reason = "Rate limit or permission issue accessing repository contents";
    } else if (!codeAnalysis.hasCode) {
      reason = codeAnalysis.reason || "No code files detected in repository";
    }

    return res.json({
      ok: exists && accessible && codeAnalysis.hasCode,
      exists,
      accessible,
      hasCode: codeAnalysis.hasCode,
      owner,
      repo,
      branch: targetBranch,
      defaultBranch,
      branches,
      codeMetrics: {
        fileCount: codeAnalysis.codeFileCount,
        languages: codeAnalysis.languages,
        primaryLanguage: codeAnalysis.primaryLanguage,
        languagePercentages: codeAnalysis.languagePercentages,
        hasTests: codeAnalysis.hasTests,
        hasReadme: codeAnalysis.hasReadme,
        hasLicense: codeAnalysis.hasLicense,
        hasCI: codeAnalysis.hasCI,
        hasDockerfile: codeAnalysis.hasDockerfile,
        configFiles: codeAnalysis.configFiles,
        qualityScore: codeAnalysis.qualityScore,
        projectType: codeAnalysis.projectType,
      },
      reason,
    });
  } catch (err: any) {
    console.error("Error validating repository:", err.message || err);
    return res.status(500).json({
      ok: false,
      reason: `Internal error validating repository: ${err.message || "Unknown error"}`,
    });
  }
}

function parseGithubUrl(raw: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(raw);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    let repo = parts[1];
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);
    return { owner: parts[0], repo };
  } catch {
    return null;
  }
}

async function ghGet(url: string): Promise<globalThis.Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GH_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GH_TOKEN}`;
  }
  return fetch(url, { headers });
}

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  JavaScript: ["js", "mjs", "cjs"],
  TypeScript: ["ts", "tsx"],
  JSX: ["jsx"],
  Python: ["py", "pyw", "pyx"],
  Java: ["java"],
  Kotlin: ["kt", "kts"],
  Go: ["go"],
  Ruby: ["rb", "rake"],
  PHP: ["php"],
  C: ["c", "h"],
  "C++": ["cpp", "cc", "cxx", "hpp", "hxx"],
  "C#": ["cs"],
  Rust: ["rs"],
  Swift: ["swift"],
  Dart: ["dart"],
  Scala: ["scala", "sc"],
  R: ["r"],
  Perl: ["pl", "pm"],
  Shell: ["sh", "bash", "zsh"],
  Vue: ["vue"],
  Svelte: ["svelte"],
  HTML: ["html", "htm"],
  CSS: ["css", "scss", "sass", "less"],
  SQL: ["sql"],
  Elixir: ["ex", "exs"],
  Haskell: ["hs"],
  Lua: ["lua"],
  "Objective-C": ["m", "mm"],
  COBOL: ["cbl", "cob", "cpy"],
  Fortran: ["f", "f90", "f95", "for"],
  Pascal: ["pas", "pp"],
  Assembly: ["asm", "s"],
  MATLAB: ["m"],
  Julia: ["jl"],
  Groovy: ["groovy", "gvy"],
  Clojure: ["clj", "cljs", "cljc"],
  Erlang: ["erl"],
  "F#": ["fs", "fsx"],
  OCaml: ["ml", "mli"],
  Racket: ["rkt"],
  Scheme: ["scm", "ss"],
};

const CONFIG_FILES = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "requirements.txt",
  "setup.py",
  "pyproject.toml",
  "Pipfile",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "Cargo.toml",
  "Cargo.lock",
  "go.mod",
  "go.sum",
  "Gemfile",
  "Gemfile.lock",
  "composer.json",
  "composer.lock",
  "pubspec.yaml",
  "mix.exs",
  "Makefile",
  "CMakeLists.txt",
]);

const TEST_DIRS = new Set(["test", "tests", "__tests__", "spec", "specs"]);

interface CodeAnalysis {
  hasCode: boolean;
  accessible: boolean;
  codeFileCount: number;
  languages: string[];
  primaryLanguage: string;
  languagePercentages?: Record<string, number>;
  hasTests: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
  hasCI: boolean;
  hasDockerfile: boolean;
  configFiles: string[];
  qualityScore: number;
  projectType: string;
  reason?: string;
}

async function searchRepositoryFiles(
  owner: string,
  repo: string,
  branch: string
): Promise<any[]> {
  const files: any[] = [];
  const filePatterns = [
    "extension:js",
    "extension:ts",
    "extension:tsx",
    "extension:py",
    "extension:java",
    "extension:go",
    "extension:rb",
    "extension:php",
    "extension:rs",
    "filename:package.json",
    "filename:requirements.txt",
    "filename:Dockerfile",
    "filename:README.md",
    "filename:.travis.yml",
    "filename:Jenkinsfile",
  ];

  try {
    for (const pattern of filePatterns) {
      try {
        const searchResp = await ghGet(
          `https://api.github.com/search/code?q=repo:${owner}/${repo}+${pattern}&per_page=5`
        );
        if (searchResp.status === 200) {
          const searchData = (await searchResp.json()) as any;
          if (searchData.items && Array.isArray(searchData.items)) {
            files.push(
              ...searchData.items.map((item: any) => ({
                path: item.path,
                type: "blob",
                size: item.size,
              }))
            );
          }
        } else if (searchResp.status === 403 || searchResp.status === 429) {
          console.warn(`Search API rate limit (${searchResp.status}), stopping search`);
          break;
        }
      } catch (patternErr) {
        console.warn(`Error searching pattern ${pattern}:`, (patternErr as any).message);
        continue;
      }
    }
  } catch (err) {
    console.warn("Error in searchRepositoryFiles:", (err as any).message);
  }

  return files;
}

async function analyzeRepository(
  owner: string,
  repo: string,
  branch: string
): Promise<CodeAnalysis> {
  const result: CodeAnalysis = {
    hasCode: false,
    accessible: true,
    codeFileCount: 0,
    languages: [],
    primaryLanguage: "Unknown",
    hasTests: false,
    hasReadme: false,
    hasLicense: false,
    hasCI: false,
    hasDockerfile: false,
    configFiles: [],
    qualityScore: 0,
    projectType: "Unknown",
  };

  const languageCounts: Record<string, number> = {};
  const discoveredConfigs: string[] = [];

  try {
    let files: any[] = [];

    const treeResp = await ghGet(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );

    if (treeResp.status === 403) {
      result.accessible = false;
      result.reason = "Rate limit exceeded or access forbidden";
      return result;
    }

    if (treeResp.status === 200) {
      const treeData = await treeResp.json();
      files = (treeData as any).tree || [];
    }

    if (files.length === 0) {
      files = await searchRepositoryFiles(owner, repo, branch);
    }

    if (files.length === 0) {
      result.hasCode = true;
      result.reason =
        "Repository exists but file listing unavailable (API limitation)";
      return result;
    }

    for (const file of files) {
      if (file.type !== "blob") continue;

      const path = file.path.toLowerCase();
      const fileName = path.split("/").pop() || "";

      if (fileName.startsWith("readme")) {
        result.hasReadme = true;
      }

      if (fileName.startsWith("license") || fileName.startsWith("licence")) {
        result.hasLicense = true;
      }

      if (fileName === "dockerfile" || fileName.startsWith("dockerfile.")) {
        result.hasDockerfile = true;
      }

      if (
        path.includes(".github/workflows") ||
        fileName === ".travis.yml" ||
        fileName === "jenkinsfile" ||
        fileName === "azure-pipelines.yml" ||
        fileName === ".circleci/config.yml"
      ) {
        result.hasCI = true;
      }

      const pathParts = path.split("/");
      if (pathParts.some((part: string) => TEST_DIRS.has(part))) {
        result.hasTests = true;
      }

      if (CONFIG_FILES.has(fileName)) {
        discoveredConfigs.push(fileName);
      }

      const ext = fileName.split(".").pop() || "";
      for (const [language, extensions] of Object.entries(
        LANGUAGE_EXTENSIONS
      )) {
        if (extensions.includes(ext)) {
          languageCounts[language] = (languageCounts[language] || 0) + 1;
          result.codeFileCount++;
          break;
        }
      }
    }

    const sortedLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

    result.languages = sortedLanguages;
    result.primaryLanguage = sortedLanguages[0] || "Unknown";
    result.configFiles = discoveredConfigs;
    result.hasCode = result.codeFileCount > 0;

    if (result.codeFileCount > 0) {
      const percentages: Record<string, number> = {};
      for (const [lang, count] of Object.entries(languageCounts)) {
        percentages[lang] =
          Math.round((count / result.codeFileCount) * 100 * 10) / 10;
      }
      result.languagePercentages = percentages;
    }

    result.projectType = determineProjectType(languageCounts, discoveredConfigs);

    let score = 0;
    if (result.hasCode) score += 1;
    if (result.codeFileCount >= 10) score += 1;
    if (result.hasReadme) score += 1;
    if (result.hasTests) score += 1;
    if (result.hasCI || result.hasLicense) score += 1;
    result.qualityScore = score;

    if (!result.hasCode) {
      result.reason = "No code files detected (only documentation/assets)";
    } else if (result.codeFileCount < 3) {
      result.reason = `Only ${result.codeFileCount} code file(s) found - small project`;
    }

    return result;
  } catch (err) {
    console.error("Error in analyzeRepository:", (err as any).message);
    result.accessible = false;
    result.reason = `Error analyzing repository: ${(err as any).message}`;
    return result;
  }
}

function determineProjectType(
  languageCounts: Record<string, number>,
  configFiles: string[]
): string {
  if (configFiles.includes("package.json")) {
    if (languageCounts["TypeScript"] > 0 || languageCounts["JavaScript"] > 0) {
      if (languageCounts["JSX"] > 0 || languageCounts["TypeScript"] > 0) {
        return "Web Application (React/Next.js)";
      }
      if (languageCounts["Vue"] > 0) return "Web Application (Vue.js)";
      if (languageCounts["Svelte"] > 0) return "Web Application (Svelte)";
      return "JavaScript/Node.js Project";
    }
  }

  if (
    configFiles.includes("requirements.txt") ||
    configFiles.includes("setup.py") ||
    configFiles.includes("pyproject.toml")
  ) {
    return "Python Project";
  }

  if (configFiles.includes("pom.xml") || configFiles.includes("build.gradle")) {
    return "Java Project (Maven/Gradle)";
  }

  if (configFiles.includes("go.mod")) {
    return "Go Project";
  }

  if (configFiles.includes("Cargo.toml")) {
    return "Rust Project";
  }

  if (configFiles.includes("Gemfile")) {
    return "Ruby Project";
  }

  if (configFiles.includes("composer.json")) {
    return "PHP Project";
  }

  if (configFiles.includes("pubspec.yaml")) {
    return "Dart/Flutter Project";
  }

  if (languageCounts["Swift"] > 0) return "iOS Application";
  if (languageCounts["Kotlin"] > 0 && languageCounts["Java"] > 0) return "Android Application";

  if (languageCounts["COBOL"] > 0) return "COBOL Project";
  if (languageCounts["Fortran"] > 0) return "Fortran Project";
  if (languageCounts["Pascal"] > 0) return "Pascal Project";

  const primaryLang = Object.entries(languageCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  if (primaryLang) {
    return `${primaryLang} Project`;
  }

  return "Code Repository";
}
