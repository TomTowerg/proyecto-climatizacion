import express from 'express'
import { 
  getEquipos, 
  getEquipoById, 
  createEquipo, 
  updateEquipo, 
  deleteEquipo 
} from '../controllers/equipoController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de equipos
router.get('/', getEquipos)
router.get('/:id', getEquipoById)
router.post('/', createEquipo)
router.put('/:id', updateEquipo)
router.delete('/:id', deleteEquipo)

export default router