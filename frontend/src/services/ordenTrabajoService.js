import api from './authService'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

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

// ⭐ GENERAR PDF DE ORDEN DE TRABAJO
export const generarPDFOrden = async (id) => {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_URL}/ordenes-trabajo/${id}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Error al generar PDF')
  }
  
  return await response.blob()
}

// ⭐ SUBIR DOCUMENTO FIRMADO
export const subirDocumentoFirmado = async (id, file) => {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('documento', file)
  
  const response = await fetch(`${API_URL}/ordenes-trabajo/${id}/documento-firmado`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al subir documento')
  }
  
  return await response.json()
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO
export const descargarDocumentoFirmado = async (id) => {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${API_URL}/ordenes-trabajo/${id}/documento-firmado`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Error al descargar documento')
  }
  
  return await response.blob()
}