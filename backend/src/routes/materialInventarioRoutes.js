import express from 'express'
import { authenticate } from '../middleware/auth.js'  // ⭐ CORREGIDO
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
router.get('/', authenticate, getMateriales)

// ⭐ OBTENER ESTADÍSTICAS
// GET /api/materiales-inventario/estadisticas
router.get('/estadisticas', authenticate, getEstadisticas)

// ⭐ OBTENER MATERIALES CON STOCK BAJO
// GET /api/materiales-inventario/stock-bajo
router.get('/stock-bajo', authenticate, getMaterialesStockBajo)

// ⭐ OBTENER MATERIAL POR ID
// GET /api/materiales-inventario/:id
router.get('/:id', authenticate, getMaterialById)

// ⭐ CREAR MATERIAL
// POST /api/materiales-inventario
router.post('/', authenticate, createMaterial)

// ⭐ ACTUALIZAR MATERIAL
// PUT /api/materiales-inventario/:id
router.put('/:id', authenticate, updateMaterial)

// ⭐ AJUSTAR STOCK
// PATCH /api/materiales-inventario/:id/ajustar-stock
router.patch('/:id/ajustar-stock', authenticate, ajustarStock)

// ⭐ ELIMINAR/DESACTIVAR MATERIAL
// DELETE /api/materiales-inventario/:id
router.delete('/:id', authenticate, deleteMaterial)

export default router