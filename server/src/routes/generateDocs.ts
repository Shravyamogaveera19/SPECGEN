import { Router } from "express";
import { generateDocs } from "../controllers/generateDocsController";

const router = Router();

// POST /api/generate-docs
router.post("/", generateDocs);

export default router;
