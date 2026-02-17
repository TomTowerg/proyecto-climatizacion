import prisma from '../utils/prisma.js'
import { decryptSensitiveFields } from '../utils/encryption.js'
import { parsePagination, paginatedResponse, parseSearch } from '../utils/pagination.js'

/**
 * CONTROLADOR DE COTIZACIONES - VERSIÓN CORREGIDA
 * Con soporte para múltiples equipos, materiales y descifrado
 */

// ⭐ OBTENER TODAS LAS COTIZACIONES
export const getCotizaciones = async (req, res) => {
  try {
    const pagination = parsePagination(req.query)
    const search = parseSearch(req.query)

    const queryOptions = {
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            email: true,
            telefono: true,
            rut_encrypted: true,
            rut_hash: true,
            email_encrypted: true,
            email_hash: true,
            telefono_encrypted: true,
            direccion_encrypted: true,
            direccion: true
          }
        },
        inventario: {
          select: {
            id: true,
            tipo: true,
            marca: true,
            modelo: true,
            numeroSerie: true,
            capacidad: true,
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
        materiales: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    // Construir WHERE para búsqueda
    if (search) {
      queryOptions.where = {
        OR: [
          { tipo: { contains: search, mode: 'insensitive' } },
          { estado: { contains: search, mode: 'insensitive' } },
          { agente: { contains: search, mode: 'insensitive' } },
          { notas: { contains: search, mode: 'insensitive' } },
          { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
          { inventario: { marca: { contains: search, mode: 'insensitive' } } },
          { inventario: { modelo: { contains: search, mode: 'insensitive' } } }
        ]
      }
    }

    if (pagination) {
      const [cotizaciones, total] = await Promise.all([
        prisma.cotizacion.findMany({
          ...queryOptions,
          skip: pagination.skip,
          take: pagination.take
        }),
        prisma.cotizacion.count({ where: queryOptions.where })
      ])

      return res.json(paginatedResponse(cotizaciones, total, pagination))
    }

    // Sin paginación: devolver todo (retrocompatible)
    const cotizaciones = await prisma.cotizacion.findMany(queryOptions)
    res.json(cotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    res.status(500).json({
      error: 'Error al obtener cotizaciones',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ OBTENER COTIZACIÓN POR ID
export const getCotizacionById = async (req, res) => {
  try {
    const { id } = req.params

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
        equipo: true,
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
        materiales: true
      }
    })

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    res.json(cotizacion)
  } catch (error) {
    console.error('Error al obtener cotización:', error)
    res.status(500).json({
      error: 'Error al obtener cotización',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ CREAR COTIZACIÓN
export const createCotizacion = async (req, res) => {
  try {
    const {
      clienteId,
      inventarioId,
      equipoId,
      tipo,
      marca,
      modelo,
      capacidad,
      precioOfertado,
      costoInstalacion,
      costoMaterial,
      subtotal,
      descuento,
      precioFinal,
      notas,
      agente,
      direccionInstalacion,
      equipos,
      materiales
    } = req.body

    console.log('📝 Creando cotización:', {
      clienteId,
      tipo,
      equiposCount: equipos?.length || 0,
      materialesCount: materiales?.length || 0
    })

    // Validaciones básicas
    if (!clienteId || !precioOfertado || !subtotal || !precioFinal) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: clienteId, precioOfertado, subtotal, precioFinal'
      })
    }

    // Crear cotización con relaciones
    const cotizacion = await prisma.cotizacion.create({
      data: {
        clienteId: parseInt(clienteId),
        inventarioId: inventarioId ? parseInt(inventarioId) : null,
        equipoId: equipoId ? parseInt(equipoId) : null,
        tipo,
        marca,
        modelo,
        capacidad,
        precioOfertado: parseFloat(precioOfertado),
        costoInstalacion: costoInstalacion ? parseFloat(costoInstalacion) : 100000,
        costoMaterial: costoMaterial ? parseFloat(costoMaterial) : 0,
        subtotal: parseFloat(subtotal),
        descuento: descuento ? parseFloat(descuento) : 0,
        precioFinal: parseFloat(precioFinal),
        notas,
        agente,
        direccionInstalacion,
        equipos: equipos && equipos.length > 0 ? {
          create: equipos.map(eq => ({
            inventarioId: parseInt(eq.inventarioId),
            cantidad: parseInt(eq.cantidad),
            precioUnitario: parseFloat(eq.precioUnitario),
            subtotal: parseFloat(eq.subtotal)
          }))
        } : undefined,
        materiales: materiales && materiales.length > 0 ? {
          create: materiales.map(mat => ({
            nombre: mat.nombre,
            cantidad: parseFloat(mat.cantidad),
            unidad: mat.unidad,
            precioUnitario: parseFloat(mat.precioUnitario),
            subtotal: parseFloat(mat.subtotal),
            descripcion: mat.descripcion
          }))
        } : undefined
      },
      include: {
        cliente: true,
        inventario: true,
        equipos: {
          include: {
            inventario: true
          }
        },
        materiales: true
      }
    })

    console.log(`✅ Cotización creada: #${cotizacion.id}`)

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al crear cotización:', error)
    res.status(500).json({
      error: 'Error al crear cotización',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ ACTUALIZAR COTIZACIÓN
export const updateCotizacion = async (req, res) => {
  try {
    const { id } = req.params
    const {
      clienteId,
      inventarioId,
      equipoId,
      tipo,
      marca,
      modelo,
      capacidad,
      precioOfertado,
      costoInstalacion,
      costoMaterial,
      subtotal,
      descuento,
      precioFinal,
      estado,
      notas,
      agente,
      direccionInstalacion,
      equipos,
      materiales
    } = req.body

    console.log(`📝 Actualizando cotización #${id}`)

    // Verificar que existe
    const existing = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Actualizar cotización
    const cotizacion = await prisma.cotizacion.update({
      where: { id: parseInt(id) },
      data: {
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        inventarioId: inventarioId ? parseInt(inventarioId) : undefined,
        equipoId: equipoId ? parseInt(equipoId) : undefined,
        tipo,
        marca,
        modelo,
        capacidad,
        precioOfertado: precioOfertado ? parseFloat(precioOfertado) : undefined,
        costoInstalacion: costoInstalacion !== undefined ? parseFloat(costoInstalacion) : undefined,
        costoMaterial: costoMaterial !== undefined ? parseFloat(costoMaterial) : undefined,
        subtotal: subtotal ? parseFloat(subtotal) : undefined,
        descuento: descuento !== undefined ? parseFloat(descuento) : undefined,
        precioFinal: precioFinal ? parseFloat(precioFinal) : undefined,
        estado,
        notas,
        agente,
        direccionInstalacion
      },
      include: {
        cliente: true,
        inventario: true,
        equipos: {
          include: {
            inventario: true
          }
        },
        materiales: true
      }
    })

    console.log(`✅ Cotización actualizada: #${id}`)

    res.json({
      message: 'Cotización actualizada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    res.status(500).json({
      error: 'Error al actualizar cotización',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ ELIMINAR COTIZACIÓN
export const deleteCotizacion = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.cotizacion.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Cotización eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    res.status(500).json({
      error: 'Error al eliminar cotización',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ APROBAR COTIZACIÓN
export const aprobar = async (req, res) => {
  try {
    const { id } = req.params
    const usuarioId = req.user?.id || 1

    console.log(`\n🔄 Aprobando cotización #${id}...`)

    // Importar servicio dinámicamente
    const { aprobarCotizacion } = await import('../services/cotizacionService.js')

    const resultado = await aprobarCotizacion(parseInt(id), usuarioId)

    res.json(resultado)
  } catch (error) {
    console.error('❌ Error al aprobar cotización:', error)
    res.status(500).json({
      error: error.message || 'Error al aprobar cotización'
    })
  }
}

// ⭐ RECHAZAR COTIZACIÓN
export const rechazar = async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body

    const cotizacion = await prisma.cotizacion.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'rechazada',
        fechaRespuesta: new Date(),
        notas: motivo || 'Rechazada por el cliente'
      },
      include: {
        cliente: true,
        inventario: true
      }
    })

    res.json({
      message: 'Cotización rechazada',
      cotizacion
    })
  } catch (error) {
    console.error('Error al rechazar cotización:', error)
    res.status(500).json({
      error: 'Error al rechazar cotización',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ OBTENER ESTADÍSTICAS
export const getEstadisticas = async (req, res) => {
  try {
    const [total, pendientes, aprobadas, rechazadas] = await Promise.all([
      prisma.cotizacion.count(),
      prisma.cotizacion.count({ where: { estado: 'pendiente' } }),
      prisma.cotizacion.count({ where: { estado: 'aprobada' } }),
      prisma.cotizacion.count({ where: { estado: 'rechazada' } })
    ])

    res.json({
      total,
      pendientes,
      aprobadas,
      rechazadas
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ GENERAR PDF
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📄 Generando PDF de cotización #${id}...`)

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        inventario: true,
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
        materiales: true
      }
    })

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // ⭐ DESCIFRAR DATOS DEL CLIENTE
    if (cotizacion.cliente) {
      try {
        if (cotizacion.cliente.rut_encrypted ||
          cotizacion.cliente.email_encrypted ||
          cotizacion.cliente.telefono_encrypted ||
          cotizacion.cliente.direccion_encrypted) {
          console.log('🔓 Descifrando datos del cliente...')
          cotizacion.cliente = decryptSensitiveFields(cotizacion.cliente)
          console.log('✅ Datos descifrados exitosamente')
        }
      } catch (decryptError) {
        console.log('⚠️  Error al descifrar:', decryptError.message)
      }
    }

    // Importar servicio de PDF
    const { generarPDFCotizacion } = await import('../services/pdfService.js')

    const resultado = await generarPDFCotizacion(cotizacion)

    if (resultado.success) {
      // Enviar el archivo PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename=${resultado.fileName}`)
      res.sendFile(resultado.filePath)
    } else {
      res.status(500).json({ error: 'Error al generar PDF' })
    }
  } catch (error) {
    console.error('❌ Error al generar PDF:', error)
    res.status(500).json({
      error: 'Error al generar PDF',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
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
