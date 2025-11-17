import express from 'express'
import { 
  getOrdenesTrabajo, 
  getOrdenTrabajoById, 
  createOrdenTrabajo, 
  updateOrdenTrabajo, 
  deleteOrdenTrabajo,
  completarOrden,
  getEstadisticas 
} from '../controllers/ordenTrabajoController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Obtener estadísticas (debe ir antes de /:id)
router.get('/estadisticas', authenticate, getEstadisticas)

// Obtener todas las órdenes de trabajo
router.get('/', authenticate, getOrdenesTrabajo)

// Obtener orden de trabajo por ID
router.get('/:id', authenticate, getOrdenTrabajoById)

// Crear orden de trabajo
router.post('/', authenticate, createOrdenTrabajo)

// Actualizar orden de trabajo
router.put('/:id', authenticate, updateOrdenTrabajo)

// ⭐ COMPLETAR ORDEN DE TRABAJO (NUEVO)
router.patch('/:id/completar', authenticate, completarOrden)

// Eliminar orden de trabajo
router.delete('/:id', authenticate, deleteOrdenTrabajo)

export default router