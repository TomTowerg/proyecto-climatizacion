import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getMateriales,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStock,
  getMaterialesStockBajo,
  getEstadisticas
} from '../controllers/materialInventarioController.js'

const router = express.Router()

/**
 * RUTAS DE INVENTARIO DE MATERIALES
 * Base: /api/materiales-inventario
 */

// ⭐ OBTENER TODOS LOS MATERIALES
// GET /api/materiales-inventario
router.get('/', authenticateToken, getMateriales)

// ⭐ OBTENER ESTADÍSTICAS
// GET /api/materiales-inventario/estadisticas
router.get('/estadisticas', authenticateToken, getEstadisticas)

// ⭐ OBTENER MATERIALES CON STOCK BAJO
// GET /api/materiales-inventario/stock-bajo
router.get('/stock-bajo', authenticateToken, getMaterialesStockBajo)

// ⭐ OBTENER MATERIAL POR ID
// GET /api/materiales-inventario/:id
router.get('/:id', authenticateToken, getMaterialById)

// ⭐ CREAR MATERIAL
// POST /api/materiales-inventario
router.post('/', authenticateToken, createMaterial)

// ⭐ ACTUALIZAR MATERIAL
// PUT /api/materiales-inventario/:id
router.put('/:id', authenticateToken, updateMaterial)

// ⭐ AJUSTAR STOCK
// PATCH /api/materiales-inventario/:id/ajustar-stock
router.patch('/:id/ajustar-stock', authenticateToken, ajustarStock)

// ⭐ ELIMINAR/DESACTIVAR MATERIAL
// DELETE /api/materiales-inventario/:id
router.delete('/:id', authenticateToken, deleteMaterial)

export default router