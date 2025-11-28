import express from 'express'
import { 
  getInventario, 
  getInventarioById, 
  createInventario, 
  updateInventario, 
  deleteInventario,
  getInventarioPublic
} from '../controllers/inventarioController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// ========================================
// RUTA PÚBLICA - Sin autenticación (para landing)
// ========================================
router.get('/public', getInventarioPublic)

// ========================================
// RUTAS PROTEGIDAS - Requieren autenticación
// ========================================
router.use(authenticate)

// Rutas de inventario
router.get('/', getInventario)
router.get('/:id', getInventarioById)
router.post('/', createInventario)
router.put('/:id', updateInventario)
router.delete('/:id', deleteInventario)

export default router