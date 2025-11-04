import { generarContenido, chatConContexto } from '../services/geminiService.js'

// Traductor
export const traducir = async (req, res) => {
  try {
    const { texto, idiomaDestino } = req.body

    if (!texto || !idiomaDestino) {
      return res.status(400).json({ 
        error: 'Texto e idioma destino son requeridos' 
      })
    }

    const idiomas = {
      'es': 'español',
      'en': 'inglés',
      'pt': 'portugués',
      'fr': 'francés'
    }

    const idiomaCompleto = idiomas[idiomaDestino] || idiomaDestino

    const prompt = `Traduce el siguiente texto al ${idiomaCompleto}. Solo devuelve la traducción, sin explicaciones adicionales:

"${texto}"`

    const traduccion = await generarContenido(prompt)

    res.json({
      textoOriginal: texto,
      textoTraducido: traduccion.trim(),
      idiomaDestino
    })
  } catch (error) {
    console.error('Error al traducir:', error)
    res.status(500).json({ 
      error: 'Error al traducir texto',
      details: error.message 
    })
  }
}

// Generar recomendaciones
export const generarRecomendaciones = async (req, res) => {
  try {
    const { tipo, equipo, trabajoRealizado } = req.body

    if (!tipo || !trabajoRealizado) {
      return res.status(400).json({ 
        error: 'Tipo y trabajo realizado son requeridos' 
      })
    }

    const prompt = `Eres un experto en sistemas de climatización (aires acondicionados).

Se realizó un trabajo de ${tipo} en un equipo:
Equipo: ${equipo?.marca || 'N/A'} ${equipo?.modelo || 'N/A'} ${equipo?.tipo || ''}
Trabajo realizado: ${trabajoRealizado}

Genera recomendaciones profesionales para el cliente en formato estructurado:

1. MANTENIMIENTO PREVENTIVO (2-3 recomendaciones específicas)
2. AHORRO DE ENERGÍA (2 consejos prácticos)
3. PRÓXIMO MANTENIMIENTO (cuándo debería ser, en meses)

Usa un tono profesional pero amigable. Sé específico y práctico.`

    const recomendaciones = await generarContenido(prompt)

    res.json({
      recomendaciones: recomendaciones.trim(),
      tipo,
      fecha: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error al generar recomendaciones:', error)
    res.status(500).json({ 
      error: 'Error al generar recomendaciones',
      details: error.message 
    })
  }
}

// Analizar urgencia
export const analizarUrgencia = async (req, res) => {
  try {
    const { descripcion, tipo, cliente } = req.body

    if (!descripcion) {
      return res.status(400).json({ 
        error: 'Descripción es requerida' 
      })
    }

    const prompt = `Eres un experto en climatización que debe analizar la urgencia de un reporte.

TIPO DE TRABAJO: ${tipo || 'No especificado'}
CLIENTE: ${cliente || 'No especificado'}
DESCRIPCIÓN DEL PROBLEMA:
"${descripcion}"

Analiza y clasifica la urgencia como:
- CRÍTICA: Falla total, afecta negocio/salud, requiere atención inmediata
- MEDIA: Funciona mal, necesita atención en 24-48 horas
- BAJA: Mantenimiento preventivo, puede esperar días/semanas

Responde SOLO en este formato JSON exacto (sin texto adicional):
{
  "nivel": "CRÍTICA|MEDIA|BAJA",
  "razones": ["razón 1", "razón 2", "razón 3"],
  "accionRecomendada": "Descripción breve de la acción",
  "tiempoRespuesta": "Tiempo sugerido de respuesta"
}`

    const analisis = await generarContenido(prompt)
    
    // Intentar parsear JSON de la respuesta
    let resultado
    try {
      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = analisis.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se pudo extraer JSON')
      }
    } catch (parseError) {
      // Si falla el parse, devolver estructura básica
      resultado = {
        nivel: 'MEDIA',
        razones: ['Análisis automático no disponible'],
        accionRecomendada: 'Revisar manualmente',
        tiempoRespuesta: '24 horas'
      }
    }

    res.json(resultado)
  } catch (error) {
    console.error('Error al analizar urgencia:', error)
    res.status(500).json({ 
      error: 'Error al analizar urgencia',
      details: error.message 
    })
  }
}

    // Chat asistente
   // Chat asistente
    export const chat = async (req, res) => {
      try {
        const { mensaje, historial } = req.body

        if (!mensaje) {
          return res.status(400).json({ 
            error: 'Mensaje es requerido' 
          })
        }

        // Crear prompt con contexto del sistema
        let prompt = `Eres CLIMB-BOT, un asistente experto en sistemas de climatización (aires acondicionados).

    INSTRUCCIONES IMPORTANTES:
    - Respuestas MÁX 3-4 líneas (máximo 50 palabras)
    - Directo al punto, sin rodeos
    - Si necesitas hacer una lista, máximo 3 puntos
    - Usa emojis ocasionales para claridad
    - Tono profesional pero amigable
    - Si la pregunta requiere diagnóstico extenso, da 2-3 pasos clave solamente

      Usuario: ${mensaje}

      Responde de forma BREVE y DIRECTA:`

          const respuesta = await generarContenido(prompt)

          res.json({
            respuesta: respuesta.trim(),
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error en chat:', error)
          res.status(500).json({ 
            error: 'Error al procesar mensaje',
            details: error.message 
          })
        }
}
