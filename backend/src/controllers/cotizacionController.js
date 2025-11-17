import prisma from '../utils/prisma.js'
import { aprobarCotizacion, rechazarCotizacion, obtenerEstadisticasCotizaciones } from '../services/cotizacionService.js'
import { generarPDFCotizacion } from '../services/pdfService.js'
import fs from 'fs'

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES ORIGINALES (MANTENIDAS)
 * ═══════════════════════════════════════════════════════
 */

// Obtener todas las cotizaciones
export const getCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            email: true,
            telefono: true
          }
        },
        inventario: {
          select: {
            id: true,
            tipo: true,
            marca: true,
            modelo: true,
            numeroSerie: true,
            capacidadBTU: true,
            precioCliente: true
          }
        },
        equipoCreado: true,
        ordenCreada: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(cotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    res.status(500).json({ error: 'Error al obtener cotizaciones' })
  }
}

// Obtener cotización por ID
export const getCotizacionById = async (req, res) => {
  try {
    const { id } = req.params

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
        equipoCreado: true,
        ordenCreada: {
          include: {
            tecnico: true
          }
        }
      }
    })

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    res.json(cotizacion)
  } catch (error) {
    console.error('Error al obtener cotización:', error)
    res.status(500).json({ error: 'Error al obtener cotización' })
  }
}

// Crear cotización
export const createCotizacion = async (req, res) => {
  try {
    const { 
      tipo, // instalacion, mantencion, reparacion
      clienteId, 
      inventarioId, 
      precioOfertado, 
      costoInstalacion,
      costoMaterial,
      descuento, 
      notas,
      agente,
      direccionInstalacion
    } = req.body

    // Log para debug
    console.log('Datos recibidos:', req.body)

    // Validaciones
    if (!tipo || !clienteId) {
      return res.status(400).json({ 
        error: 'Tipo de servicio y cliente son requeridos' 
      })
    }

    if (tipo === 'instalacion' && !inventarioId) {
      return res.status(400).json({ 
        error: 'Para instalación se requiere seleccionar un producto del inventario' 
      })
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Si es instalación, verificar que el producto existe
    let producto = null
    if (inventarioId) {
      producto = await prisma.inventario.findUnique({
        where: { id: parseInt(inventarioId) }
      })

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado en inventario' })
      }

      if (producto.stock === 0) {
        return res.status(400).json({ 
          error: 'Producto sin stock disponible' 
        })
      }
    }

    // Calcular precio final
    const basePrice = precioOfertado || (producto?.precioCliente || 0)
    const instalacion = parseFloat(costoInstalacion) || 0
    const materiales = parseFloat(costoMaterial) || 0
    const desc = parseFloat(descuento) || 0
    
    const subtotal = basePrice + instalacion + materiales
    const precioFinal = subtotal * (1 - desc / 100)

    console.log('Cálculo:', { basePrice, instalacion, materiales, desc, subtotal, precioFinal })

    // Crear cotización
    const cotizacion = await prisma.cotizacion.create({
      data: {
        tipo: tipo || 'instalacion',
        clienteId: parseInt(clienteId),
        inventarioId: inventarioId ? parseInt(inventarioId) : null,
        precioOfertado: basePrice,
        costoInstalacion: instalacion,
        costoMaterial: materiales,
        descuento: desc,
        subtotal,
        precioFinal,
        notas: notas || '',
        agente,
        direccionInstalacion,
        estado: 'pendiente'
      },
      include: {
        cliente: true,
        inventario: true
      }
    })

    console.log(`✅ Cotización creada: #${cotizacion.id} - ${tipo}`)

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al crear cotización:', error)
    res.status(500).json({ 
      error: 'Error al crear cotización',
      details: error.message 
    })
  }
}

// Actualizar cotización (cambiar estado, precio, etc)
export const updateCotizacion = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, precioOfertado, descuento, notas, fechaRespuesta } = req.body

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: { inventario: true }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // No permitir actualizar si ya está aprobada o eliminada
    if (existingCotizacion.estado !== 'pendiente' && estado) {
      return res.status(400).json({ 
        error: 'No se puede modificar una cotización aprobada o eliminada' 
      })
    }

    // Calcular nuevo precio final si cambió
    const desc = descuento !== undefined ? parseFloat(descuento) : existingCotizacion.descuento
    const precio = precioOfertado !== undefined ? parseFloat(precioOfertado) : existingCotizacion.precioOfertado
    const instalacion = existingCotizacion.costoInstalacion || 0
    const materiales = existingCotizacion.costoMaterial || 0
    
    const subtotal = precio + instalacion + materiales
    const precioFinal = subtotal * (1 - desc / 100)

    const updateData = {
      precioOfertado: precio,
      descuento: desc,
      subtotal,
      precioFinal,
      notas: notas !== undefined ? notas : existingCotizacion.notas
    }

    if (estado) {
      updateData.estado = estado
    }

    if (fechaRespuesta) {
      updateData.fechaRespuesta = new Date(fechaRespuesta)
    }

    const cotizacion = await prisma.cotizacion.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        cliente: true,
        inventario: true
      }
    })

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    res.status(500).json({ error: 'Error al actualizar cotización' })
  }
}

// Eliminar cotización
export const deleteCotizacion = async (req, res) => {
  try {
    const { id } = req.params

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    if (existingCotizacion.estado === 'aprobada') {
      return res.status(400).json({ 
        error: 'No se puede eliminar una cotización aprobada' 
      })
    }

    await prisma.cotizacion.delete({
      where: { id: parseInt(id) }
    })

    res.json({ 
      success: true,
      message: 'Cotización eliminada exitosamente' 
    })
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    res.status(500).json({ error: 'Error al eliminar cotización' })
  }
}

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES NUEVAS - FASE 2
 * ═══════════════════════════════════════════════════════
 */

/**
 * APROBAR COTIZACIÓN ⭐ ENDPOINT PRINCIPAL FASE 2
 * Ejecuta el flujo automático: Cliente → Equipo → OT → Stock
 */
export const aprobar = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = req.userId || 1 // ID del usuario que aprueba

    console.log(`\n🚀 Aprobando cotización #${id}...`)

    const resultado = await aprobarCotizacion(parseInt(id), usuarioId)

    res.json({
      success: true,
      mensaje: resultado.mensaje,
      cotizacion: resultado.cotizacion,
      equipo: resultado.equipo,
      ordenTrabajo: resultado.ordenTrabajo
    })

  } catch (error) {
    console.error('❌ Error al aprobar cotización:', error)
    res.status(500).json({ 
      error: 'Error al aprobar cotización',
      detalle: error.message 
    })
  }
}

/**
 * RECHAZAR COTIZACIÓN
 */
export const rechazar = async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body

    const resultado = await rechazarCotizacion(parseInt(id), motivo)

    res.json({
      success: true,
      mensaje: resultado.mensaje,
      cotizacion: resultado.cotizacion
    })

  } catch (error) {
    console.error('Error al rechazar cotización:', error)
    res.status(500).json({ 
      error: 'Error al rechazar cotización',
      detalle: error.message 
    })
  }
}

/**
 * OBTENER ESTADÍSTICAS
 */
export const getEstadisticas = async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticasCotizaciones()
    res.json(estadisticas)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      detalle: error.message 
    })
  }
}

/**
 * GENERAR PDF DE COTIZACIÓN ⭐ NUEVO
 */
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log(`📄 Generando PDF para cotización #${id}`)

    // Obtener cotización con todas las relaciones
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true
      }
    })

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Solo generar PDF para cotizaciones aprobadas
    if (cotizacion.estado !== 'aprobada') {
      return res.status(400).json({ 
        error: 'Solo se puede generar PDF de cotizaciones aprobadas' 
      })
    }

    // Generar PDF usando el servicio existente
    const resultado = await generarPDFCotizacion(cotizacion)

    // Leer el archivo generado
    const pdfBuffer = fs.readFileSync(resultado.filePath)

    // Configurar headers para visualización en navegador
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=cotizacion-${id}.pdf`)
    res.setHeader('Content-Length', pdfBuffer.length)

    // Enviar PDF
    res.send(pdfBuffer)

    console.log(`✅ PDF enviado para cotización #${id}`)

  } catch (error) {
    console.error('❌ Error al generar PDF:', error)
    res.status(500).json({ 
      error: 'Error al generar PDF',
      detalle: error.message 
    })
  }
}

export default {
  // Funciones originales
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  
  // Funciones nuevas Fase 2
  aprobar,
  rechazar,
  getEstadisticas,
  generarPDF
}