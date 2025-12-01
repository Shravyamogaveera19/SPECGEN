import { Router } from 'express';

// Minimal validation for public GitHub repos using GitHub REST API (no token required for public)
// POST /api/validate-repo  body: { url: string, branch?: string }
// Response shape aligns with client expectations

interface ValidationRequestBody {
  url?: string;
  branch?: string;
}

const router = Router();

router.post('/', async (req, res) => {
  const { url, branch } = req.body as ValidationRequestBody;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ ok: false, reason: 'Missing or invalid url field' });
  }

  // Parse GitHub URL (https only for now)
  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return res.status(400).json({ ok: false, reason: 'Invalid GitHub repository URL format' });
  }
  const { owner, repo } = parsed;

  try {
    // Repo metadata
    const repoResp = await ghGet(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoResp.status === 404) {
      return res.status(404).json({ ok: false, reason: 'Repository not found', exists: false });
    }
    if (repoResp.status === 403) {
      return res.status(403).json({ ok: false, reason: 'Access forbidden or rate limit exceeded', accessible: false });
    }
    const repoData = await repoResp.json();
    const defaultBranch: string = repoData.default_branch;
    const targetBranch = branch || defaultBranch;

    // Fetch all branches
    const branchesResp = await ghGet(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`);
    let branches: string[] = [];
    if (branchesResp.status === 200) {
      const branchData = await branchesResp.json();
      branches = branchData.map((b: any) => b.name);
    }

    // Branch validation if provided
    if (branch) {
      if (!branches.includes(branch)) {
        return res.status(404).json({ ok: false, reason: `Branch '${branch}' not found; default is '${defaultBranch}'`, exists: true, accessible: true, branches });
      }
    }

    // Root contents to detect code presence
    const contentsResp = await ghGet(`https://api.github.com/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(targetBranch)}`);
    let hasCode = false;
    let exists = true;
    let accessible = true;
    let reason: string | undefined;
    if (contentsResp.status === 200) {
      const items = await contentsResp.json();
      if (Array.isArray(items)) {
        const codeExts = new Set(['js','ts','tsx','jsx','py','java','go','rb','php','c','cpp','rs']);
        const codeFiles = items.filter((it: any) => {
          if (it.type !== 'file') return false;
          const parts = it.name.split('.');
          if (parts.length < 2) return false;
          const ext = parts.pop()?.toLowerCase();
          return ext ? codeExts.has(ext) : false;
        });
        const codeDirs = items.filter((it: any) => it.type === 'dir' && ['src','lib','app','server','backend'].includes(it.name));
        hasCode = codeFiles.length > 0 || codeDirs.length > 0;
        if (!hasCode) {
          reason = 'No code files detected in root (only docs/assets)';
        }
      }
    } else if (contentsResp.status === 404) {
      reason = 'Contents not found for branch';
    } else if (contentsResp.status === 403) {
      accessible = false;
      reason = 'Rate limit or permission issue accessing contents';
    }

    return res.json({
      ok: exists && accessible && hasCode,
      exists,
      accessible,
      hasCode,
      owner,
      repo,
      branch: targetBranch,
      defaultBranch,
      branches,
      reason,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: 'Internal error validating repository' });
  }
});

function parseGithubUrl(raw: string): { owner: string; repo: string } | null {
  // Supports forms like https://github.com/owner/repo or with .git suffix
  try {
    const u = new URL(raw);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    let repo = parts[1];
    if (repo.endsWith('.git')) repo = repo.slice(0, -4);
    return { owner: parts[0], repo };
  } catch {
    return null;
  }
}

async function ghGet(url: string): Promise<Response> {
  // If GH_TOKEN is present, include it; even for public we skip if absent
  const headers: Record<string,string> = {
    'Accept': 'application/vnd.github+json'
  };
  if (process.env.GH_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GH_TOKEN}`;
  }
  return fetch(url, { headers });
}

export default router;
