import { Router } from "express";
import { validateRepo } from "../controllers/validateRepoController";

const router = Router();

// POST /api/validate-repo
router.post("/", validateRepo);

export default router;
