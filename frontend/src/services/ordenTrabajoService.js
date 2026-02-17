import api from './authService'

// ⭐ NO NECESITAS API_URL - axios ya lo tiene configurado

// Obtener todas las órdenes de trabajo (con paginación y búsqueda opcional)
export const getOrdenesTrabajo = async ({ page, limit, search } = {}) => {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  const response = await api.get('/ordenes-trabajo', { params })
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

// Completar orden de trabajo
export const completarOrden = async (id) => {
  const response = await api.patch(`/ordenes-trabajo/${id}/completar`)
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

// ⭐ GENERAR PDF DE ORDEN DE TRABAJO (CORREGIDO)
export const generarPDFOrden = async (id) => {
  const response = await api.get(`/ordenes-trabajo/${id}/pdf`, {
    responseType: 'blob'  // ⭐ Importante para recibir el PDF
  })
  return response.data
}

// ⭐ SUBIR DOCUMENTO FIRMADO (CORREGIDO)
export const subirDocumentoFirmado = async (id, file) => {
  const formData = new FormData()
  formData.append('documento', file)

  const response = await api.post(`/ordenes-trabajo/${id}/documento-firmado`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO (CORREGIDO)
export const descargarDocumentoFirmado = async (id) => {
  const response = await api.get(`/ordenes-trabajo/${id}/documento-firmado`, {
    responseType: 'blob'
  })
  return response.data
}