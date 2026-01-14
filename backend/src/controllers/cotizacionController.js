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
        equipo: {
          select: {
            id: true,
            tipo: true,
            marca: true,
            modelo: true,
            numeroSerie: true,
            capacidad: true,
            tipoGas: true,
            clienteId: true
          }
        },
        materiales: true, // ⭐ INCLUIR MATERIALES
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
        equipo: true,
        materiales: true, // ⭐ INCLUIR MATERIALES
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

// ⭐ CREAR COTIZACIÓN CON MATERIALES
export const createCotizacion = async (req, res) => {
  try {
    const { 
      tipo,
      clienteId, 
      inventarioId,
      equipoId,
      precioOfertado, 
      costoInstalacion,
      costoMaterial, // Esto ahora se calcula automáticamente
      descuento, 
      notas,
      agente,
      direccionInstalacion,
      materiales // ⭐ NUEVO - Array de materiales
    } = req.body

    console.log('📋 Datos recibidos:', { tipo, clienteId, inventarioId, equipoId, materiales })

    // Validaciones básicas
    if (!tipo || !clienteId) {
      return res.status(400).json({ 
        error: 'Tipo de servicio y cliente son requeridos' 
      })
    }

    // Validaciones por tipo de servicio
    if (tipo === 'instalacion' && !inventarioId) {
      return res.status(400).json({ 
        error: 'Para instalación se requiere seleccionar un producto del inventario' 
      })
    }

    if ((tipo === 'mantencion' || tipo === 'reparacion') && !equipoId) {
      return res.status(400).json({ 
        error: `Para ${tipo} se requiere seleccionar un equipo del cliente` 
      })
    }

    // Verificar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    let producto = null
    let equipo = null

    // Validar inventario (instalación)
    if (tipo === 'instalacion' && inventarioId) {
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

    // Validar equipo (mantención/reparación)
    if ((tipo === 'mantencion' || tipo === 'reparacion') && equipoId) {
      equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(equipoId) },
        include: { cliente: true }
      })

      if (!equipo) {
        return res.status(404).json({ error: 'Equipo no encontrado' })
      }

      if (equipo.clienteId !== parseInt(clienteId)) {
        return res.status(400).json({ 
          error: 'El equipo no pertenece al cliente seleccionado' 
        })
      }
    }

    // ⭐ CALCULAR COSTO DE MATERIALES
    let costoMaterialTotal = 0
    const materialesValidados = []

    if (materiales && Array.isArray(materiales) && materiales.length > 0) {
      console.log(`📦 Procesando ${materiales.length} materiales...`)
      
      for (const material of materiales) {
        // Validar campos requeridos
        if (!material.nombre || !material.cantidad || !material.precioUnitario || !material.unidad) {
          return res.status(400).json({ 
            error: 'Cada material debe tener nombre, cantidad, unidad y precio unitario' 
          })
        }

        const cantidad = parseFloat(material.cantidad)
        const precioUnitario = parseFloat(material.precioUnitario)
        
        if (cantidad <= 0 || precioUnitario <= 0) {
          return res.status(400).json({ 
            error: 'Cantidad y precio unitario deben ser mayores a 0' 
          })
        }

        const subtotalMaterial = cantidad * precioUnitario
        costoMaterialTotal += subtotalMaterial

        materialesValidados.push({
          nombre: material.nombre,
          cantidad: cantidad,
          unidad: material.unidad,
          precioUnitario: precioUnitario,
          subtotal: subtotalMaterial,
          descripcion: material.descripcion || null
        })
      }

      console.log(`💰 Costo total de materiales: $${costoMaterialTotal.toLocaleString('es-CL')}`)
    }

    // Calcular precio final
    const basePrice = precioOfertado || (producto?.precioCliente || 0)
    const instalacion = parseFloat(costoInstalacion) || 0
    const desc = parseFloat(descuento) || 0
    
    const subtotal = basePrice + instalacion + costoMaterialTotal
    const precioFinal = subtotal * (1 - desc / 100)

    console.log('💰 Cálculo:', { 
      basePrice, 
      instalacion, 
      materiales: costoMaterialTotal, 
      desc, 
      subtotal, 
      precioFinal 
    })

    // Preparar datos de cotización
    const cotizacionData = {
      tipo: tipo || 'instalacion',
      clienteId: parseInt(clienteId),
      precioOfertado: basePrice,
      costoInstalacion: instalacion,
      costoMaterial: costoMaterialTotal, // ⭐ Calculado automáticamente
      descuento: desc,
      subtotal,
      precioFinal,
      notas: notas || '',
      agente,
      direccionInstalacion,
      estado: 'pendiente'
    }

    // Agregar inventarioId o equipoId según tipo
    if (tipo === 'instalacion' && inventarioId) {
      cotizacionData.inventarioId = parseInt(inventarioId)
    }

    if ((tipo === 'mantencion' || tipo === 'reparacion') && equipoId) {
      cotizacionData.equipoId = parseInt(equipoId)
    }

    // ⭐ CREAR COTIZACIÓN CON MATERIALES
    const cotizacion = await prisma.cotizacion.create({
      data: {
        ...cotizacionData,
        // ⭐ Crear materiales relacionados
        materiales: {
          create: materialesValidados
        }
      }
    })

    console.log(`✅ Cotización creada: #${cotizacion.id} - ${tipo}`)
    if (materialesValidados.length > 0) {
      console.log(`   📦 ${materialesValidados.length} materiales agregados`)
    }

    // Obtener cotización completa con relaciones
    const cotizacionCompleta = await prisma.cotizacion.findUnique({
      where: { id: cotizacion.id },
      include: {
        cliente: true,
        inventario: true,
        equipo: true,
        materiales: true // ⭐ INCLUIR MATERIALES
      }
    })

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      cotizacion: cotizacionCompleta
    })
  } catch (error) {
    console.error('❌ Error al crear cotización:', error)
    res.status(500).json({ 
      error: 'Error al crear cotización',
      details: error.message 
    })
  }
}

// Actualizar cotización
export const updateCotizacion = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      estado, 
      precioOfertado, 
      descuento, 
      notas, 
      fechaRespuesta,
      materiales // ⭐ Permitir actualizar materiales
    } = req.body

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: { 
        inventario: true,
        materiales: true // ⭐ INCLUIR MATERIALES
      }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    if (existingCotizacion.estado !== 'pendiente' && estado) {
      return res.status(400).json({ 
        error: 'No se puede modificar una cotización aprobada o eliminada' 
      })
    }

    // ⭐ RECALCULAR COSTO DE MATERIALES SI SE ACTUALIZAN
    let costoMaterialTotal = existingCotizacion.costoMaterial

    if (materiales && Array.isArray(materiales)) {
      // Eliminar materiales existentes
      await prisma.materialCotizacion.deleteMany({
        where: { cotizacionId: parseInt(id) }
      })

      // Crear nuevos materiales
      costoMaterialTotal = 0
      for (const material of materiales) {
        const cantidad = parseFloat(material.cantidad)
        const precioUnitario = parseFloat(material.precioUnitario)
        const subtotalMaterial = cantidad * precioUnitario
        costoMaterialTotal += subtotalMaterial

        await prisma.materialCotizacion.create({
          data: {
            cotizacionId: parseInt(id),
            nombre: material.nombre,
            cantidad: cantidad,
            unidad: material.unidad,
            precioUnitario: precioUnitario,
            subtotal: subtotalMaterial,
            descripcion: material.descripcion || null
          }
        })
      }
    }

    // Calcular nuevo precio final
    const desc = descuento !== undefined ? parseFloat(descuento) : existingCotizacion.descuento
    const precio = precioOfertado !== undefined ? parseFloat(precioOfertado) : existingCotizacion.precioOfertado
    const instalacion = existingCotizacion.costoInstalacion || 0
    
    const subtotal = precio + instalacion + costoMaterialTotal
    const precioFinal = subtotal * (1 - desc / 100)

    const updateData = {
      precioOfertado: precio,
      descuento: desc,
      costoMaterial: costoMaterialTotal, // ⭐ Actualizar costo
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
        inventario: true,
        materiales: true // ⭐ INCLUIR MATERIALES
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

// Eliminar cotización (elimina materiales automáticamente por onDelete: Cascade)
export const deleteCotizacion = async (req, res) => {
  try {
    const { id } = req.params

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Los materiales se eliminan automáticamente por CASCADE
    await prisma.cotizacion.delete({
      where: { id: parseInt(id) }
    })

    res.json({ 
      success: true,
      message: 'Cotización eliminada exitosamente' 
    })
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'No se puede eliminar porque tiene registros relacionados',
        sugerencia: 'Elimine primero el equipo y la orden de trabajo asociados'
      })
    }
    
    res.status(500).json({ 
      error: 'Error al eliminar cotización',
      detalle: error.message 
    })
  }
}

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES NUEVAS - FASE 2
 * ═══════════════════════════════════════════════════════
 */

// Aprobar cotización
export const aprobar = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = req.userId || 1

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

// Rechazar cotización
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

// Obtener estadísticas
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

// ⭐ GENERAR PDF CON MATERIALES
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log(`📄 Generando PDF para cotización #${id}`)

    // Obtener cotización con materiales
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
        materiales: true // ⭐ INCLUIR MATERIALES PARA PDF
      }
    })

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Generar PDF
    const resultado = await generarPDFCotizacion(cotizacion)

    // Leer archivo
    const pdfBuffer = fs.readFileSync(resultado.filePath)

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=cotizacion-${id}.pdf`)
    res.setHeader('Content-Length', pdfBuffer.length)
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
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  aprobar,
  rechazar,
  getEstadisticas,
  generarPDF
}