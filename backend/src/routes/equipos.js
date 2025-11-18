import { Router } from 'express'
import { 
  getEquipos, 
  getEquipoById, 
  getEquiposByCliente, // ⭐ NUEVO
  createEquipo, 
  updateEquipo, 
  deleteEquipo 
} from '../controllers/equipoController.js'
import { authenticate } from '../middleware/auth.js' // ⭐ ACTUALIZADO para usar tu archivo existente

const router = Router()

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate) // ⭐ ACTUALIZADO

// ⭐ IMPORTANTE: Esta ruta DEBE ir ANTES de /:id
// Si no, Express interpreta "cliente" como un ID
router.get('/cliente/:clienteId', getEquiposByCliente)

// Rutas existentes
router.get('/', getEquipos)
router.get('/:id', getEquipoById)
router.post('/', createEquipo)
router.put('/:id', updateEquipo)
router.delete('/:id', deleteEquipo)

export default router