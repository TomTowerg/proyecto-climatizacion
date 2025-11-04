import express from 'express'
import { 
  getOrdenesTrabajo, 
  getOrdenTrabajoById, 
  createOrdenTrabajo, 
  updateOrdenTrabajo, 
  deleteOrdenTrabajo,
  getEstadisticas
} from '../controllers/ordenTrabajoController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de órdenes de trabajo
router.get('/', getOrdenesTrabajo)
router.get('/estadisticas', getEstadisticas)
router.get('/:id', getOrdenTrabajoById)
router.post('/', createOrdenTrabajo)
router.put('/:id', updateOrdenTrabajo)
router.delete('/:id', deleteOrdenTrabajo)

export default router