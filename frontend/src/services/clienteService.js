import api from './authService'

// Obtener todos los clientes
export const getClientes = async () => {
  const response = await api.get('/clientes')
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