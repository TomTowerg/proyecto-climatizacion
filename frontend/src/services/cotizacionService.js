import api from './authService'

// Obtener todas las cotizaciones
export const getCotizaciones = async () => {
  const response = await api.get('/cotizaciones')
  return response.data
}

// Obtener cotización por ID
export const getCotizacionById = async (id) => {
  const response = await api.get(`/cotizaciones/${id}`)
  return response.data
}

// Crear cotización
export const createCotizacion = async (cotizacionData) => {
  const response = await api.post('/cotizaciones', cotizacionData)
  return response.data
}

// Actualizar cotización
export const updateCotizacion = async (id, cotizacionData) => {
  const response = await api.put(`/cotizaciones/${id}`, cotizacionData)
  return response.data
}

// Eliminar cotización
export const deleteCotizacion = async (id) => {
  const response = await api.delete(`/cotizaciones/${id}`)
  return response.data
}