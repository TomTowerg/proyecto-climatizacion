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
import direccionClienteRoutes from './direccionClienteRoutes.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas anidadas para direcciones (se inyectan con :clienteId disponible gracias a mergeParams)
router.use('/:clienteId/direcciones', direccionClienteRoutes)

// Rutas de clientes
router.get('/', getClientes)
router.get('/:id', getClienteById)
router.post('/', validateCliente, createCliente)
router.put('/:id', validateCliente, updateCliente)
router.delete('/:id', deleteCliente)

export default router