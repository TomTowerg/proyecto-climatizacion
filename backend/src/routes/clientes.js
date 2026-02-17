import express from 'express'
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/clienteController.js'
import { authenticate } from '../middleware/auth.js'
import { validateCliente } from '../middleware/validationMiddleware.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de clientes
router.get('/', getClientes)
router.get('/:id', getClienteById)
router.post('/', validateCliente, createCliente)
router.put('/:id', validateCliente, updateCliente)
router.delete('/:id', deleteCliente)

export default router