import api from './authService'

/**
 * SERVICIO DE TIPOS DE INSTALACIÓN
 * Catálogo reutilizable de tipos de instalación con precios
 */

export const getTiposInstalacion = async () => {
  const response = await api.get('/tipos-instalacion')
  return response.data
}

export const createTipoInstalacion = async (data) => {
  const response = await api.post('/tipos-instalacion', data)
  return response.data
}

export const updateTipoInstalacion = async (id, data) => {
  const response = await api.put(`/tipos-instalacion/${id}`, data)
  return response.data
}

export const deleteTipoInstalacion = async (id) => {
  const response = await api.delete(`/tipos-instalacion/${id}`)
  return response.data
}
