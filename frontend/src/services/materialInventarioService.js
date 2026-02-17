import api from './authService'

/**
 * SERVICIO DE INVENTARIO DE MATERIALES
 */

// ⭐ OBTENER TODOS LOS MATERIALES (con paginación y búsqueda opcional)
export const getMateriales = async ({ page, limit, search } = {}) => {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  const response = await api.get('/materiales-inventario', { params })
  return response.data
}

// ⭐ OBTENER MATERIAL POR ID
export const getMaterialById = async (id) => {
  const response = await api.get(`/materiales-inventario/${id}`)
  return response.data
}

// ⭐ CREAR MATERIAL
export const createMaterial = async (materialData) => {
  const response = await api.post('/materiales-inventario', materialData)
  return response.data
}

// ⭐ ACTUALIZAR MATERIAL
export const updateMaterial = async (id, materialData) => {
  const response = await api.put(`/materiales-inventario/${id}`, materialData)
  return response.data
}

// ⭐ ELIMINAR MATERIAL
export const deleteMaterial = async (id) => {
  const response = await api.delete(`/materiales-inventario/${id}`)
  return response.data
}

// ⭐ AJUSTAR STOCK
export const ajustarStock = async (id, cantidad, tipo, motivo) => {
  const response = await api.patch(`/materiales-inventario/${id}/ajustar-stock`, {
    cantidad,
    tipo, // 'aumentar' o 'disminuir'
    motivo
  })
  return response.data
}

// ⭐ OBTENER MATERIALES CON STOCK BAJO
export const getMaterialesStockBajo = async () => {
  const response = await api.get('/materiales-inventario/stock-bajo')
  return response.data
}

// ⭐ OBTENER ESTADÍSTICAS
export const getEstadisticas = async () => {
  const response = await api.get('/materiales-inventario/estadisticas')
  return response.data
}

export default {
  getMateriales,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStock,
  getMaterialesStockBajo,
  getEstadisticas
}