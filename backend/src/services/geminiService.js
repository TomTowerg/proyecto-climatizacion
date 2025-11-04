import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Obtener modelo
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

/**
 * Generar contenido con Gemini
 * @param {string} prompt - El texto que le envías a la IA
 * @returns {string} - La respuesta de la IA
 */
export const generarContenido = async (prompt) => {
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    return text
  } catch (error) {
    console.error('Error al generar contenido con Gemini:', error)
    throw new Error('Error al comunicarse con la IA')
  }
}

/**
 * Chat con contexto (para el asistente)
 * @param {array} mensajes - Array de mensajes previos
 * @returns {string} - Respuesta de la IA
 */
export const chatConContexto = async (mensajes) => {
  try {
    const chat = model.startChat({
      history: mensajes.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    })

    const result = await chat.sendMessage(mensajes[mensajes.length - 1].content)
    const response = await result.response
    const text = response.text()
    return text
  } catch (error) {
    console.error('Error en chat con Gemini:', error)
    throw new Error('Error al comunicarse con la IA')
  }
}

export default {
  generarContenido,
  chatConContexto
}