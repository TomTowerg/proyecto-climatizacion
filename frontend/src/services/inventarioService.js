import api from './authService'

// ═══════════════════════════════════════════════════════
// FUNCIONES BÁSICAS CRUD
// ═══════════════════════════════════════════════════════

export const getInventario = async ({ page, limit, search } = {}) => {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  const response = await api.get('/inventario', { params })
  return response.data
}

export const getInventarioById = async (id) => {
  const response = await api.get(`/inventario/${id}`)
  return response.data
}

export const createInventario = async (itemData) => {
  const response = await api.post('/inventario', itemData)
  return response.data
}

export const updateInventario = async (id, itemData) => {
  const response = await api.put(`/inventario/${id}`, itemData)
  return response.data
}

export const deleteInventario = async (id) => {
  const response = await api.delete(`/inventario/${id}`)
  return response.data
}

// ═══════════════════════════════════════════════════════
// FUNCIONES ADICIONALES - FASE 2 ⭐
// ═══════════════════════════════════════════════════════

/**
 * OBTENER ESTADÍSTICAS DEL INVENTARIO
 */
export const getEstadisticasInventario = async () => {
  try {
    const response = await api.get('/inventario/estadisticas')
    return response.data
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    // Retornar datos por defecto en caso de error
    return {
      total: 0,
      disponibles: 0,
      stockBajo: 0,
      agotados: 0,
      valorTotal: 0
    }
  }
}

/**
 * OBTENER PRODUCTOS CON STOCK BAJO
 */
export const getStockBajo = async () => {
  try {
    const response = await api.get('/inventario/stock-bajo')
    return response.data
  } catch (error) {
    console.error('Error al obtener stock bajo:', error)
    return []
  }
}

/**
 * OBTENER MOVIMIENTOS RECIENTES
 */
export const getMovimientos = async (limit = 10) => {
  try {
    const response = await api.get(`/inventario/movimientos?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return []
  }
}