import api from './authService'

// Analizar urgencia
export const analizarUrgencia = async (descripcion, tipo, cliente) => {
  const response = await api.post('/ia/analizar-urgencia', {
    descripcion,
    tipo,
    cliente
  })
  return response.data
}

// Traducir texto
export const traducir = async (texto, idiomaDestino) => {
  const response = await api.post('/ia/traducir', {
    texto,
    idiomaDestino
  })
  return response.data
}

// Generar recomendaciones
export const generarRecomendaciones = async (tipo, equipo, trabajoRealizado) => {
  const response = await api.post('/ia/recomendaciones', {
    tipo,
    equipo,
    trabajoRealizado
  })
  return response.data
}

// Chat
export const chat = async (mensaje, historial = []) => {
  const response = await api.post('/ia/chat', {
    mensaje,
    historial
  })
  return response.data
}

export default {
  analizarUrgencia,
  traducir,
  generarRecomendaciones,
  chat
}