import prisma from '../utils/prisma.js'
import { aprobarCotizacion, rechazarCotizacion, obtenerEstadisticasCotizaciones } from '../services/cotizacionService.js'
import { generarPDFCotizacion } from '../services/pdfService.js'
import fs from 'fs'

/**
 * ═══════════════════════════════════════════════════════
 * FUNCIONES ORIGINALES (MANTENIDAS)
 * ═══════════════════════════════════════════════════════
 */

// ⭐ CORREGIDO: Obtener todas las cotizaciones CON EQUIPOS MÚLTIPLES
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
        // ⭐ AGREGADO: Incluir equipos múltiples con información del inventario
        equipos: {
          include: {
            inventario: {
              select: {
                id: true,
                tipo: true,
                marca: true,
                modelo: true,
                capacidadBTU: true,
                precioCliente: true
              }
            }
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

// ⭐ CORREGIDO: Obtener cotización por ID CON EQUIPOS MÚLTIPLES
export const getCotizacionById = async (req, res) => {
  try {
    const { id } = req.params

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
        equipo: true,
        // ⭐ AGREGADO: Incluir equipos múltiples con información del inventario
        equipos: {
          include: {
            inventario: {
              select: {
                id: true,
                tipo: true,
                marca: true,
                modelo: true,
                capacidadBTU: true,
                precioCliente: true
              }
            }
          }
        },
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

// ⭐ CREAR COTIZACIÓN CON MATERIALES Y MÚLTIPLES EQUIPOS
export const createCotizacion = async (req, res) => {
  try {
    const { 
      tipo,
      clienteId, 
      inventarioId,  // Sistema antiguo (un equipo)
      equipos,       // ⭐ Sistema de múltiples equipos
      equipoId,
      precioOfertado, 
      costoInstalacion,
      costoMaterial,
      descuento, 
      notas,
      agente,
      direccionInstalacion,
      materiales     // ⭐ Array de materiales
    } = req.body

    console.log('📋 Datos recibidos:', { 
      tipo, 
      clienteId, 
      inventarioId, 
      equipos: equipos?.length || 0,
      equipoId, 
      materiales: materiales?.length || 0
    })

    // Validaciones básicas
    if (!tipo || !clienteId) {
      return res.status(400).json({ 
        error: 'Tipo de servicio y cliente son requeridos' 
      })
    }

    // ⭐ VALIDACIONES POR TIPO DE SERVICIO
    if (tipo === 'instalacion') {
      // Aceptar TANTO inventarioId (antiguo) COMO equipos[] (nuevo)
      if (!inventarioId && (!equipos || equipos.length === 0)) {
        return res.status(400).json({ 
          error: 'Para instalación se requiere seleccionar al menos un producto del inventario' 
        })
      }
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

    // ⭐ VALIDAR INVENTARIO (SISTEMA ANTIGUO - UN SOLO EQUIPO)
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

    // ⭐ VALIDAR MÚLTIPLES EQUIPOS (SISTEMA NUEVO)
    if (tipo === 'instalacion' && equipos && equipos.length > 0) {
      console.log(`📦 Validando ${equipos.length} equipos...`)
      
      for (const eq of equipos) {
        const equipoInventario = await prisma.inventario.findUnique({
          where: { id: parseInt(eq.inventarioId) }
        })

        if (!equipoInventario) {
          return res.status(404).json({ 
            error: `Equipo con ID ${eq.inventarioId} no encontrado en inventario` 
          })
        }

        if (equipoInventario.stock < eq.cantidad) {
          return res.status(400).json({ 
            error: `Stock insuficiente para ${equipoInventario.marca} ${equipoInventario.modelo}. Disponible: ${equipoInventario.stock}, Solicitado: ${eq.cantidad}` 
          })
        }
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

    // ⭐ PREPARAR EQUIPOS PARA GUARDAR
    const equiposValidados = []
    if (tipo === 'instalacion' && equipos && equipos.length > 0) {
      console.log(`🛒 Procesando ${equipos.length} equipos...`)
      
      for (const eq of equipos) {
        equiposValidados.push({
          inventarioId: parseInt(eq.inventarioId),
          cantidad: parseInt(eq.cantidad),
          precioUnitario: parseFloat(eq.precioUnitario),
          subtotal: parseInt(eq.cantidad) * parseFloat(eq.precioUnitario)
        })
      }
    }

    // Calcular precio final
    const basePrice = parseFloat(precioOfertado) || (producto?.precioCliente || 0)
    const instalacion = parseFloat(costoInstalacion) || 0
    const material = parseFloat(costoMaterial) || costoMaterialTotal
    const desc = parseFloat(descuento) || 0

    const subtotal = basePrice + instalacion + material
    const precioFinal = subtotal * (1 - desc / 100)

    console.log('💰 Cálculo de precios:', {
      basePrice,
      instalacion,
      material,
      subtotal,
      descuento: desc,
      precioFinal
    })

    // Crear cotización
    const nuevaCotizacion = await prisma.cotizacion.create({
      data: {
        tipo,
        clienteId: parseInt(clienteId),
        inventarioId: inventarioId ? parseInt(inventarioId) : null,
        equipoId: equipoId ? parseInt(equipoId) : null,
        precioOfertado: basePrice,
        costoInstalacion: instalacion,
        costoMaterial: material,
        subtotal,
        descuento: desc,
        precioFinal,
        notas,
        agente,
        direccionInstalacion,
        estado: 'pendiente',
        // ⭐ CREAR MATERIALES Y EQUIPOS MÚLTIPLES
        materiales: {
          create: materialesValidados
        },
        equipos: {
          create: equiposValidados
        }
      },
      include: {
        cliente: true,
        inventario: true,
        equipo: true,
        materiales: true,
        equipos: {
          include: {
            inventario: true
          }
        }
      }
    })

    console.log('✅ Cotización creada:', nuevaCotizacion.id)

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      cotizacion: nuevaCotizacion
    })

  } catch (error) {
    console.error('❌ Error al crear cotización:', error)
    res.status(500).json({ 
      error: 'Error al crear cotización',
      detalle: error.message 
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
        materiales: true, // ⭐ INCLUIR MATERIALES
        equipos: {
          include: {
            inventario: true
          }
        }
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

    // Los materiales y equipos se eliminan automáticamente por CASCADE
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

// ⭐ GENERAR PDF CON MATERIALES Y EQUIPOS MÚLTIPLES
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log(`📄 Generando PDF para cotización #${id}`)

    // Obtener cotización con materiales y equipos múltiples
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
        materiales: true, // ⭐ INCLUIR MATERIALES PARA PDF
        equipos: {
          include: {
            inventario: true
          }
        }
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