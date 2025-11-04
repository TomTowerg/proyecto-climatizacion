import api from './authService'

// Obtener todas las órdenes de trabajo
export const getOrdenesTrabajo = async () => {
  const response = await api.get('/ordenes-trabajo')
  return response.data
}

// Obtener orden de trabajo por ID
export const getOrdenTrabajoById = async (id) => {
  const response = await api.get(`/ordenes-trabajo/${id}`)
  return response.data
}

// Crear orden de trabajo
export const createOrdenTrabajo = async (ordenData) => {
  const response = await api.post('/ordenes-trabajo', ordenData)
  return response.data
}

// Actualizar orden de trabajo
export const updateOrdenTrabajo = async (id, ordenData) => {
  const response = await api.put(`/ordenes-trabajo/${id}`, ordenData)
  return response.data
}

// Eliminar orden de trabajo
export const deleteOrdenTrabajo = async (id) => {
  const response = await api.delete(`/ordenes-trabajo/${id}`)
  return response.data
}

// Obtener estadísticas
export const getEstadisticas = async () => {
  const response = await api.get('/ordenes-trabajo/estadisticas')
  return response.data
}