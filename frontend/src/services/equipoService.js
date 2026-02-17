import api from './authService'

// Obtener equipos (con paginación y búsqueda opcionales)
export const getEquipos = async (params = {}) => {
  const response = await api.get('/equipos', { params })
  return response.data
}

// Obtener equipo por ID
export const getEquipoById = async (id) => {
  const response = await api.get(`/equipos/${id}`)
  return response.data
}
// Obtner equipos por id de clientes
export const getEquiposByCliente = async (clienteId) => {
  const response = await api.get(`/equipos/cliente/${clienteId}`)
  return response.data
}

// Crear equipo
export const createEquipo = async (equipoData) => {
  const response = await api.post('/equipos', equipoData)
  return response.data
}

// Actualizar equipo
export const updateEquipo = async (id, equipoData) => {
  const response = await api.put(`/equipos/${id}`, equipoData)
  return response.data
}

// Eliminar equipo
export const deleteEquipo = async (id) => {
  const response = await api.delete(`/equipos/${id}`)
  return response.data
}