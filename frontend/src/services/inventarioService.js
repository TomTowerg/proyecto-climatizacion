import api from './authService'

// Obtener todo el inventario
export const getInventario = async () => {
  const response = await api.get('/inventario')
  return response.data
}

// Obtener item por ID
export const getInventarioById = async (id) => {
  const response = await api.get(`/inventario/${id}`)
  return response.data
}

// Crear item en inventario
export const createInventario = async (itemData) => {
  const response = await api.post('/inventario', itemData)
  return response.data
}

// Actualizar item
export const updateInventario = async (id, itemData) => {
  const response = await api.put(`/inventario/${id}`, itemData)
  return response.data
}

// Eliminar item
export const deleteInventario = async (id) => {
  const response = await api.delete(`/inventario/${id}`)
  return response.data
}