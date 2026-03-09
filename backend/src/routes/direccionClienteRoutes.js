import express from 'express'
import {
  getDireccionesCliente,
  createDireccionCliente,
  updateDireccionCliente,
  deleteDireccionCliente
} from '../controllers/direccionClienteController.js'

const router = express.Router({ mergeParams: true }) // Permite acceder a :clienteId

// GET /api/clientes/:clienteId/direcciones
router.get('/', getDireccionesCliente)

// POST /api/clientes/:clienteId/direcciones
router.post('/', createDireccionCliente)

// PUT /api/clientes/:clienteId/direcciones/:id
router.put('/:id', updateDireccionCliente)

// DELETE /api/clientes/:clienteId/direcciones/:id
router.delete('/:id', deleteDireccionCliente)

export default router
