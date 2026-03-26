import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getCatalogoServicios, createCatalogoServicio } from '../controllers/catalogoServicioController.js'

const router = express.Router()

// GET /api/catalogo-servicios?categoria=mantencion
router.get('/', authenticate, getCatalogoServicios)

// POST /api/catalogo-servicios
router.post('/', authenticate, createCatalogoServicio)

export default router
