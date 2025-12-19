import { Router } from 'express';
import { generateDiagram } from '../controllers/generateDiagramController';

const router = Router();

// POST /api/generate-diagram
router.post('/', generateDiagram);

export default router;
