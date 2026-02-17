import express from 'express'
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  aprobar,
  rechazar,
  getEstadisticas,
  generarPDF
} from '../controllers/cotizacionController.js'
import { authenticate } from '../middleware/auth.js'
import { validateCotizacion } from '../middleware/validationMiddleware.js'

const router = express.Router()

/**
 * RUTAS DE COTIZACIONES
 * Todas las rutas requieren autenticación
 * 
 * ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las dinámicas
 */

// ═══════════════════════════════════════════════════════
// RUTAS ESPECÍFICAS (DEBEN IR PRIMERO) ⭐
// ═══════════════════════════════════════════════════════

// GET /api/cotizaciones/estadisticas - Obtener estadísticas
router.get('/estadisticas', authenticate, getEstadisticas)

// ═══════════════════════════════════════════════════════
// RUTAS CRUD BÁSICAS
// ═══════════════════════════════════════════════════════

// GET /api/cotizaciones - Obtener todas las cotizaciones
router.get('/', authenticate, getCotizaciones)

// POST /api/cotizaciones - Crear nueva cotización
router.post('/', authenticate, validateCotizacion, createCotizacion)

// ═══════════════════════════════════════════════════════
// RUTAS DINÁMICAS CON PARÁMETROS (DEBEN IR AL FINAL)
// ═══════════════════════════════════════════════════════

// POST /api/cotizaciones/:id/aprobar - ⭐ APROBAR COTIZACIÓN (Flujo automático)
router.post('/:id/aprobar', authenticate, aprobar)

// POST /api/cotizaciones/:id/rechazar - Rechazar cotización
router.post('/:id/rechazar', authenticate, rechazar)

// GET /api/cotizaciones/:id/pdf - Generar y descargar PDF
router.get('/:id/pdf', authenticate, generarPDF)

// GET /api/cotizaciones/:id - Obtener una cotización por ID
router.get('/:id', authenticate, getCotizacionById)

// PUT /api/cotizaciones/:id - Actualizar cotización
router.put('/:id', authenticate, validateCotizacion, updateCotizacion)

// DELETE /api/cotizaciones/:id - Eliminar cotización
router.delete('/:id', authenticate, deleteCotizacion)

export default router