import api from './authService'

// Obtener todos los clientes (con paginación y búsqueda opcional)
export const getClientes = async ({ page, limit, search } = {}) => {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  const response = await api.get('/clientes', { params })
  return response.data
}

// Obtener cliente por ID
export const getClienteById = async (id) => {
  const response = await api.get(`/clientes/${id}`)
  return response.data
}

// Crear cliente
export const createCliente = async (clienteData) => {
  const response = await api.post('/clientes', clienteData)
  return response.data
}

// Actualizar cliente
export const updateCliente = async (id, clienteData) => {
  const response = await api.put(`/clientes/${id}`, clienteData)
  return response.data
}

// Eliminar cliente
export const deleteCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`)
  return response.data
}