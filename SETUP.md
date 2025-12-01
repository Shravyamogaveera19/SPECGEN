# SpecGen Setup Guide

## Quick Start

### 1. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Start the Frontend Client

In a new terminal:

```bash
cd client
npm install
npm run dev
```

The client will start on `http://localhost:5173`

### 3. Test the Repository Validator

1. Open `http://localhost:5173` in your browser
2. Click "Validate Repository" or navigate to `http://localhost:5173/repo-validator`
3. Enter a GitHub repository URL (e.g., `https://github.com/facebook/react`)
4. Click "Validate"

## Environment Variables

### Server (.env)

Create a `.env` file in the `server` directory:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/specgen
GH_TOKEN=your_github_token_optional
```

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string (optional)
- `GH_TOKEN`: GitHub personal access token (optional, helps with rate limits)

## Architecture

- **Client**: React + TypeScript + Vite + Tailwind CSS (port 5173)
- **Server**: Express + TypeScript + MongoDB (port 3000)
- **ML Service**: FastAPI + Python (services/ml)

## API Proxy

The Vite dev server proxies `/api/*` requests to `http://localhost:3000` to avoid CORS issues during development.

## Troubleshooting

### "Network error while validating repository"

**Cause**: Backend server is not running or not accessible.

**Solution**: 
1. Make sure the server is running: `cd server && npm run dev`
2. Check that it's listening on port 3000
3. Verify the Vite proxy is configured in `client/vite.config.ts`

### "Port 3000 is already in use"

**Solution**: Kill the process using port 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues

If you don't have MongoDB installed locally, you can:
1. Remove `MONGODB_URI` from `.env` (server will skip MongoDB connection)
2. Install MongoDB locally
3. Use MongoDB Atlas (cloud)

## Production Build

```bash
# Build client
cd client
npm run build

# Build and start server
cd ../server
npm run build
NODE_ENV=production npm start
```

The server will serve the client's static files in production mode.
