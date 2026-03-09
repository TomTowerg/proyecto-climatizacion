import api from './authService'

export const getDireccionesCliente = async (clienteId) => {
  const response = await api.get(`/clientes/${clienteId}/direcciones`)
  return response.data
}

export const createDireccionCliente = async (clienteId, data) => {
  const response = await api.post(`/clientes/${clienteId}/direcciones`, data)
  return response.data
}

export const updateDireccionCliente = async (clienteId, id, data) => {
  const response = await api.put(`/clientes/${clienteId}/direcciones/${id}`, data)
  return response.data
}

export const deleteDireccionCliente = async (clienteId, id) => {
  const response = await api.delete(`/clientes/${clienteId}/direcciones/${id}`)
  return response.data
}
