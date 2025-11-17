import api from './authService'

// ═══════════════════════════════════════════════════════
// ENDPOINTS ORIGINALES (Mantenidos)
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
// NUEVOS ENDPOINTS - FASE 2 ⭐
// ═══════════════════════════════════════════════════════

/**
 * APROBAR COTIZACIÓN ⭐⭐⭐
 * Ejecuta el flujo automático completo:
 * - Verifica stock
 * - Crea equipo
 * - Crea orden de trabajo
 * - Reduce stock
 * - Marca cotización como aprobada
 */
export const aprobarCotizacion = async (id) => {
  const response = await api.post(`/cotizaciones/${id}/aprobar`)
  return response.data
}

/**
 * RECHAZAR COTIZACIÓN
 * Marca la cotización como rechazada
 */
export const rechazarCotizacion = async (id, motivo = '') => {
  const response = await api.post(`/cotizaciones/${id}/rechazar`, { motivo })
  return response.data
}

/**
 * OBTENER ESTADÍSTICAS
 * Obtiene métricas del sistema de cotizaciones
 */
export const getEstadisticas = async () => {
  const response = await api.get('/cotizaciones/estadisticas')
  return response.data
}

/**
 * GENERAR PDF (Future)
 * Genera PDF de la cotización
 */
export const generarPDF = async (id) => {
  const response = await api.get(`/cotizaciones/${id}/pdf`, {
    responseType: 'blob'
  })
  
  // Crear URL del blob para visualizar
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  
  return url
}