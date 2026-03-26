import api from './authService'

export const getCatalogoServicios = async (categoria) => {
  const params = categoria ? { categoria } : {}
  const response = await api.get('/catalogo-servicios', { params })
  return response.data
}

export const createCatalogoServicio = async (data) => {
  const response = await api.post('/catalogo-servicios', data)
  return response.data
}
