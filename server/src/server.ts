import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import healthRouter from "./routes/health";
import connectDB from "./db";
import path from "path";
import fs from "fs";
import validateRepoRouter from "./routes/validateRepo";
import generateDiagramRouter from "./routes/generateDiagram";
import generateDocsRouter from "./routes/generateDocs";

dotenv.config();

// Log Groq configuration
console.log("LLM Configuration (Groq - Fast & Free):");
console.log(
  "- GROQ_API_KEY:",
  process.env.GROQ_API_KEY
    ? "✓ Configured"
    : "✗ Not set - Get from https://console.groq.com/keys"
);
console.log(
  "- GitHub Token:",
  process.env.GH_TOKEN ? "✓ Configured" : "✗ Not set"
);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/validate-repo", validateRepoRouter);
app.use("/api/generate-diagram", generateDiagramRouter);
app.use("/api/generate-docs", generateDocsRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "specgen-server" });
});

// Serve frontend in production: main homepage at '/'
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }
}

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // connect to MongoDB (if MONGODB_URI provided)
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await connectDB(mongoUri);
      // eslint-disable-next-line no-console
      console.log("Connected to MongoDB");
    } else {
      // eslint-disable-next-line no-console
      console.log("No MONGODB_URI provided; skipping MongoDB connection");
    }

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
