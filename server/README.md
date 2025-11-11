# SpecGen - Server (minimal scaffold)

This is a minimal Node + TypeScript + Express scaffold for the SpecGen project.

Quick start

```bash
cd server
npm install
npm run dev        # start dev server (ts-node-dev)
# or build+start
npm run build
npm start
```

Endpoints

- GET / -> basic status JSON
- GET /health -> health and uptime

Notes

- This is intentionally minimal — we'll add routing, config, and other modules as we iterate.
- Install additional dependencies (database client, security tools) when needed.
