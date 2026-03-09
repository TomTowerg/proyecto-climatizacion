import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getTiposInstalacion,
  createTipoInstalacion,
  updateTipoInstalacion,
  deleteTipoInstalacion
} from '../controllers/tipoInstalacionController.js'

const router = express.Router()

/**
 * RUTAS DE TIPOS DE INSTALACIÓN
 * Base: /api/tipos-instalacion
 */

// GET /api/tipos-instalacion
router.get('/', authenticate, getTiposInstalacion)

// POST /api/tipos-instalacion
router.post('/', authenticate, createTipoInstalacion)

// PUT /api/tipos-instalacion/:id
router.put('/:id', authenticate, updateTipoInstalacion)

// DELETE /api/tipos-instalacion/:id
router.delete('/:id', authenticate, deleteTipoInstalacion)

export default router
