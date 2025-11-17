import express from 'express'
import { 
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  aprobar,
  rechazar,
  getEstadisticas
} from '../controllers/cotizacionController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * RUTAS DE COTIZACIONES
 * Todas las rutas requieren autenticación
 */

// GET /api/cotizaciones - Obtener todas las cotizaciones
router.get('/', authenticate, getCotizaciones)

// GET /api/cotizaciones/estadisticas - Obtener estadísticas
router.get('/estadisticas', authenticate, getEstadisticas)

// GET /api/cotizaciones/:id - Obtener una cotización por ID
router.get('/:id', authenticate, getCotizacionById)

// POST /api/cotizaciones - Crear nueva cotización
router.post('/', authenticate, createCotizacion)

// POST /api/cotizaciones/:id/aprobar - ⭐ APROBAR COTIZACIÓN (Flujo automático NUEVO)
router.post('/:id/aprobar', authenticate, aprobar)

// POST /api/cotizaciones/:id/rechazar - Rechazar cotización (NUEVO)
router.post('/:id/rechazar', authenticate, rechazar)

// PUT /api/cotizaciones/:id - Actualizar cotización
router.put('/:id', authenticate, updateCotizacion)

// DELETE /api/cotizaciones/:id - Eliminar cotización
router.delete('/:id', authenticate, deleteCotizacion)

export default router