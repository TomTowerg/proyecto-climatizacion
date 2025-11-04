import express from 'express'
import { 
  getInventario, 
  getInventarioById, 
  createInventario, 
  updateInventario, 
  deleteInventario 
} from '../controllers/inventarioController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de inventario
router.get('/', getInventario)
router.get('/:id', getInventarioById)
router.post('/', createInventario)
router.put('/:id', updateInventario)
router.delete('/:id', deleteInventario)

export default router