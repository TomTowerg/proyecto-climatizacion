import express from 'express';
import { getIndicators } from '../controllers/indicatorController.js';
import { authenticate } from '../middleware/auth.js'; // CORREGIDO: Usamos 'authenticate'

const router = express.Router();

// GET /api/indicators
// Protegemos la ruta para que solo usuarios logueados la vean
router.get('/', authenticate, getIndicators);

export default router;