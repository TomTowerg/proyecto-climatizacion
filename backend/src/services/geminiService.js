import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Obtener modelo (usando gemini-2.5-flash que es más reciente)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES ORIGINALES (MANTENIDAS)
 * ═══════════════════════════════════════════════════════
 */

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

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES NUEVAS PARA FASE 2
 * ═══════════════════════════════════════════════════════
 */

/**
 * ⭐ ANALIZAR URGENCIA DE ORDEN DE TRABAJO (NUEVO)
 * Determina el nivel de urgencia basado en la descripción del problema
 */
export const analizarUrgencia = async (descripcionProblema, tipoServicio, clienteNombre) => {
  try {
    console.log(`🤖 Analizando urgencia con IA...`)
    console.log(`📝 Problema: "${descripcionProblema}"`)
    console.log(`📝 Tipo: ${tipoServicio}`)
    console.log(`📝 Cliente: ${clienteNombre}`)

    const prompt = `
Eres un experto técnico en climatización HVAC.
Analiza la siguiente orden de trabajo y determina el nivel de urgencia:

TIPO DE SERVICIO: ${tipoServicio}
CLIENTE: ${clienteNombre}
DESCRIPCIÓN DEL PROBLEMA:
"${descripcionProblema}"

Analiza estos factores:
1. Gravedad del problema (¿afecta salud, seguridad o comodidad?)
2. Época del año (verano/invierno = más urgente)
3. Tipo de cliente (residencial, comercial, salud)
4. Riesgo de daños mayores si se demora

Clasifica la urgencia en uno de estos niveles:
- CRÍTICA: Requiere atención inmediata (menos de 4 horas)
- MEDIA: Requiere atención pronto (1-2 días)
- BAJA: Puede programarse con flexibilidad (3-7 días)

Responde ÚNICAMENTE en formato JSON válido sin markdown:
{
  "nivel": "CRÍTICA" | "MEDIA" | "BAJA",
  "razones": ["razón 1", "razón 2", "razón 3"],
  "accionRecomendada": "descripción breve de la acción a tomar",
  "tiempoRespuesta": "tiempo estimado de respuesta recomendado"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    console.log(`📥 Respuesta IA raw:`, text)

    // Limpiar el texto de markdown si existe
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const analisis = JSON.parse(text)
      
      // Validar que tenga los campos requeridos
      if (!analisis.nivel || !analisis.razones || !analisis.accionRecomendada) {
        throw new Error('Respuesta incompleta de la IA')
      }

      console.log(`✅ Análisis de urgencia completado: ${analisis.nivel}`)
      return analisis

    } catch (parseError) {
      console.error('❌ Error al parsear respuesta IA:', parseError)
      console.log('📄 Texto recibido:', text)
      
      // Fallback: intentar extraer el nivel de urgencia del texto
      const nivelMatch = text.match(/urgencia.*?(CRÍTICA|CRITICA|MEDIA|BAJA)/i)
      const nivel = nivelMatch ? nivelMatch[1].toUpperCase() : 'MEDIA'
      
      return {
        nivel: nivel,
        razones: ["Análisis realizado con IA", "Recomendación basada en descripción"],
        accionRecomendada: "Evaluar y atender según procedimiento estándar",
        tiempoRespuesta: nivel === 'CRÍTICA' ? 'Menos de 4 horas' : nivel === 'MEDIA' ? '1-2 días' : '3-7 días',
        textoCompleto: text
      }
    }

  } catch (error) {
    console.error('❌ Error en análisis de urgencia:', error)
    
    // Fallback: determinar urgencia básica por palabras clave
    const problemaBajo = descripcionProblema.toLowerCase()
    let nivelFallback = 'MEDIA'
    
    const palabrasCriticas = ['humo', 'fuego', 'quemado', 'chispas', 'peligro', 'urgente', 'emergencia', 'bebé', 'niño', 'enfermo']
    const palabrasBajas = ['preventivo', 'programado', 'limpieza', 'revisión', 'funciona bien']
    
    if (palabrasCriticas.some(p => problemaBajo.includes(p))) {
      nivelFallback = 'CRÍTICA'
    } else if (palabrasBajas.some(p => problemaBajo.includes(p))) {
      nivelFallback = 'BAJA'
    }
    
    return {
      nivel: nivelFallback,
      razones: ["Análisis automático por palabras clave"],
      accionRecomendada: "Atender según nivel de urgencia determinado",
      tiempoRespuesta: nivelFallback === 'CRÍTICA' ? 'Inmediato' : nivelFallback === 'MEDIA' ? '1-2 días' : 'Según disponibilidad',
      error: error.message
    }
  }
}

/**
 * ANALIZAR ORDEN DE TRABAJO
 * Proporciona recomendaciones basadas en el tipo de servicio y equipo
 */
export const analizarOrdenTrabajo = async (ordenTrabajo, equipo) => {
  try {
    console.log(`🤖 Analizando orden de trabajo con IA...`)

    const prompt = `
Eres un experto técnico en sistemas de climatización HVAC. 
Analiza la siguiente orden de trabajo y proporciona recomendaciones detalladas:

INFORMACIÓN DEL EQUIPO:
- Marca: ${equipo.marca}
- Modelo: ${equipo.modelo}
- Capacidad: ${equipo.capacidadBTU} BTU
- Tipo: ${equipo.tipo}
- Fecha de instalación: ${equipo.fechaInstalacion}
- Estado actual: ${equipo.estado}

ORDEN DE TRABAJO:
- Tipo de servicio: ${ordenTrabajo.tipo}
- Descripción: ${ordenTrabajo.descripcion}
- Duración estimada: ${ordenTrabajo.duracion} horas

Por favor proporciona:
1. DIAGNÓSTICO: Análisis del estado probable del equipo
2. PROCEDIMIENTO: Pasos detallados a seguir
3. MATERIALES: Lista de materiales que probablemente se necesiten
4. PRECAUCIONES: Puntos importantes a tener en cuenta
5. TIEMPO ESTIMADO: Confirmación o ajuste del tiempo estimado

Responde en formato JSON con esta estructura:
{
  "diagnostico": "...",
  "procedimiento": ["paso 1", "paso 2", ...],
  "materiales": ["material 1", "material 2", ...],
  "precauciones": ["precaución 1", "precaución 2", ...],
  "tiempoEstimado": número_de_horas,
  "nivelDificultad": "bajo|medio|alto",
  "recomendaciones": ["recomendación 1", "recomendación 2", ...]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Intentar parsear como JSON
    try {
      // Limpiar el texto de markdown si existe
      let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const analisis = JSON.parse(jsonText)
      
      console.log(`✅ Análisis IA completado`)
      return {
        success: true,
        analisis
      }
    } catch (parseError) {
      // Si falla el parseo, devolver texto plano
      return {
        success: true,
        analisis: {
          diagnostico: text,
          procedimiento: [],
          materiales: [],
          precauciones: [],
          tiempoEstimado: ordenTrabajo.duracion,
          nivelDificultad: "medio",
          recomendaciones: []
        },
        textoCompleto: text
      }
    }

  } catch (error) {
    console.error('Error en análisis IA:', error)
    return {
      success: false,
      error: error.message,
      analisis: null
    }
  }
}

/**
 * RECOMENDAR EQUIPO
 * Recomienda el equipo más adecuado según las necesidades del cliente
 */
export const recomendarEquipo = async (metrosCuadrados, presupuesto, preferencias = '') => {
  try {
    console.log(`🤖 Buscando recomendación de equipo con IA...`)

    const prompt = `
Eres un asesor experto en sistemas de climatización.
El cliente necesita un equipo de aire acondicionado con las siguientes características:

- Espacio a climatizar: ${metrosCuadrados} metros cuadrados
- Presupuesto aproximado: $${presupuesto ? presupuesto.toLocaleString('es-CL') : 'sin definir'}
- Preferencias adicionales: ${preferencias || 'ninguna especificada'}

Basándote en estas necesidades, recomienda:
1. Capacidad en BTU más adecuada
2. Tipo de equipo (Split muro, Cassette, etc.)
3. Características importantes (Inverter, WiFi, etc.)
4. Rango de precio esperado
5. Marcas recomendadas

Responde en formato JSON:
{
  "capacidadRecomendada": número_BTU,
  "tipoEquipo": "...",
  "caracteristicas": ["característica 1", "característica 2", ...],
  "rangoPrecio": {"min": número, "max": número},
  "marcasRecomendadas": ["marca 1", "marca 2", ...],
  "justificacion": "explicación de la recomendación"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const recomendacion = JSON.parse(jsonText)
      
      console.log(`✅ Recomendación IA completada`)
      return {
        success: true,
        recomendacion
      }
    } catch (parseError) {
      return {
        success: true,
        recomendacion: {
          capacidadRecomendada: Math.ceil(metrosCuadrados * 600), // Aproximación básica
          tipoEquipo: "Split Muro",
          caracteristicas: ["Inverter", "WiFi"],
          rangoPrecio: { min: 300000, max: 600000 },
          marcasRecomendadas: ["Hisense", "Kendal", "ANWO"],
          justificacion: text
        },
        textoCompleto: text
      }
    }

  } catch (error) {
    console.error('Error en recomendación IA:', error)
    return {
      success: false,
      error: error.message,
      recomendacion: null
    }
  }
}

/**
 * ANALIZAR PROBLEMA REPORTADO
 * Interpreta el problema reportado por el cliente y sugiere diagnóstico
 */
export const analizarProblema = async (descripcionProblema, equipo) => {
  try {
    console.log(`🤖 Analizando problema reportado con IA...`)

    const prompt = `
Eres un técnico experto en climatización.
Un cliente reporta el siguiente problema:

"${descripcionProblema}"

Información del equipo:
- Marca: ${equipo.marca}
- Modelo: ${equipo.modelo}
- Capacidad: ${equipo.capacidadBTU} BTU
- Años de uso: ${equipo.fechaInstalacion ? Math.floor((new Date() - new Date(equipo.fechaInstalacion)) / (365 * 24 * 60 * 60 * 1000)) : 'desconocido'}

Proporciona:
1. Posibles causas del problema
2. Urgencia del servicio (baja/media/alta)
3. Tipo de servicio recomendado (mantención/reparación)
4. Costo estimado aproximado
5. Tiempo de resolución estimado

Responde en formato JSON:
{
  "causasPosibles": ["causa 1", "causa 2", ...],
  "urgencia": "baja|media|alta",
  "tipoServicio": "mantencion|reparacion",
  "costoEstimado": {"min": número, "max": número},
  "tiempoResolucion": "...",
  "requiereInspeccion": boolean,
  "recomendaciones": ["recomendación 1", ...]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const analisis = JSON.parse(jsonText)
      
      console.log(`✅ Análisis de problema completado`)
      return {
        success: true,
        analisis
      }
    } catch (parseError) {
      return {
        success: true,
        analisis: {
          causasPosibles: ["Requiere inspección técnica"],
          urgencia: "media",
          tipoServicio: "mantencion",
          costoEstimado: { min: 30000, max: 80000 },
          tiempoResolucion: "1-2 horas",
          requiereInspeccion: true,
          recomendaciones: []
        },
        textoCompleto: text
      }
    }

  } catch (error) {
    console.error('Error en análisis de problema:', error)
    return {
      success: false,
      error: error.message,
      analisis: null
    }
  }
}

/**
 * BUSCAR EQUIPO CON IA (Búsqueda semántica)
 * Permite búsquedas en lenguaje natural como "necesito un aire para 25m²"
 */
export const buscarEquipoConIA = async (consultaUsuario, inventario) => {
  try {
    console.log(`🤖 Buscando equipo con IA: "${consultaUsuario}"`)

    const prompt = `
Eres un experto en climatización. El cliente dice:

"${consultaUsuario}"

Basándote en su solicitud, determina:
1. Metros cuadrados aproximados (si los menciona)
2. Presupuesto aproximado (si lo menciona)
3. Características deseadas (WiFi, silencioso, económico, etc.)
4. Capacidad en BTU recomendada

Responde en formato JSON:
{
  "metrosCuadrados": número_o_null,
  "presupuesto": número_o_null,
  "caracteristicas": ["característica 1", ...],
  "btuRecomendado": número,
  "interpretacion": "explicación breve de lo que entendiste"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const interpretacion = JSON.parse(jsonText)

    console.log(`✅ Interpretación IA completada`)
    
    // Filtrar inventario según interpretación
    let equiposFiltrados = inventario.filter(eq => {
      let cumple = true
      
      // Filtrar por BTU si se determinó
      if (interpretacion.btuRecomendado) {
        const margen = 3000 // Margen de ±3000 BTU
        cumple = cumple && Math.abs(eq.capacidadBTU - interpretacion.btuRecomendado) <= margen
      }
      
      // Filtrar por presupuesto si se mencionó
      if (interpretacion.presupuesto) {
        cumple = cumple && eq.precioCliente <= interpretacion.presupuesto * 1.2 // 20% margen
      }
      
      // Filtrar por características si se mencionaron
      if (interpretacion.caracteristicas.length > 0) {
        const caracteristicasEquipo = (eq.caracteristicas || '').toLowerCase()
        interpretacion.caracteristicas.forEach(carac => {
          if (caracteristicasEquipo.includes(carac.toLowerCase())) {
            cumple = cumple && true
          }
        })
      }
      
      return cumple && eq.stock > 0
    })

    return {
      success: true,
      interpretacion,
      equiposRecomendados: equiposFiltrados.slice(0, 5), // Top 5
      totalEncontrados: equiposFiltrados.length
    }

  } catch (error) {
    console.error('Error en búsqueda IA:', error)
    return {
      success: false,
      error: error.message,
      interpretacion: null,
      equiposRecomendados: []
    }
  }
}

export default {
  // Funciones originales
  generarContenido,
  chatConContexto,
  
  // Funciones nuevas Fase 2
  analizarUrgencia,      // ⭐ NUEVA - Para órdenes de trabajo
  analizarOrdenTrabajo,
  recomendarEquipo,
  analizarProblema,
  buscarEquipoConIA
}