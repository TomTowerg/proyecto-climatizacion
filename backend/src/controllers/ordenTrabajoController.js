import prisma from '../utils/prisma.js'
import { decryptSensitiveFields } from '../utils/encryption.js'
import { generarPDFOrdenTrabajo } from '../services/ordenTrabajoPDFService.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * CONTROLADOR DE ÓRDENES DE TRABAJO - VERSIÓN CORREGIDA
 * Con descifrado de datos y manejo robusto de errores
 */

// ⭐ OBTENER TODAS LAS ÓRDENES
export const getOrdenesTrabajo = async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            telefono: true,
            rut_encrypted: true,
            telefono_encrypted: true
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
            inventario: {
              select: {
                capacidadBTU: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const ordenesConCapacidad = ordenes.map(orden => {
      if (orden.equipo && orden.equipo.inventario) {
        return {
          ...orden,
          equipo: {
            ...orden.equipo,
            capacidad: orden.equipo.capacidad || `${orden.equipo.inventario.capacidadBTU} BTU`
          }
        }
      }
      return orden
    })

    res.json(ordenesConCapacidad)
  } catch (error) {
    console.error('Error al obtener órdenes de trabajo:', error)
    res.status(500).json({ 
      error: 'Error al obtener órdenes de trabajo',
      details: error.message
    })
  }
}

// ⭐ OBTENER ORDEN POR ID
export const getOrdenTrabajoById = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        equipo: {
          include: {
            inventario: true
          }
        }
      }
    })

    if (!orden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    res.json(orden)
  } catch (error) {
    console.error('Error al obtener orden de trabajo:', error)
    res.status(500).json({ 
      error: 'Error al obtener orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ CREAR ORDEN
export const createOrdenTrabajo = async (req, res) => {
  try {
    const { 
      clienteId, 
      equipoId, 
      tipo, 
      fecha, 
      notas, 
      tecnico, 
      estado, 
      urgencia, 
      analisisIA 
    } = req.body

    console.log('📝 Creando orden con análisis:', analisisIA)

    if (!clienteId || !tipo) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: clienteId, tipo' 
      })
    }

    const orden = await prisma.ordenTrabajo.create({
      data: {
        clienteId: parseInt(clienteId),
        equipoId: equipoId ? parseInt(equipoId) : null,
        tipo,
        fecha: fecha ? new Date(fecha) : new Date(),
        notas,
        tecnico,
        estado: estado || 'pendiente',
        urgencia: urgencia || 'media',
        
      },
      include: {
        cliente: true,
        equipo: {
          include: {
            inventario: true
          }
        }
      }
    })

    console.log(`✅ Orden creada: #${orden.id}`)

    res.status(201).json({
      message: 'Orden de trabajo creada exitosamente',
      orden
    })
  } catch (error) {
    console.error('Error al crear orden de trabajo:', error)
    res.status(500).json({ 
      error: 'Error al crear orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ ACTUALIZAR ORDEN
export const updateOrdenTrabajo = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    const {
      clienteId,
      equipoId,
      tipo,
      fecha,
      notas,
      tecnico,
      estado,
      urgencia,
      
    } = req.body

    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    const orden = await prisma.ordenTrabajo.update({
      where: { id: parseInt(id) },
      data: {
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        equipoId: equipoId ? parseInt(equipoId) : undefined,
        tipo,
        fecha: fecha ? new Date(fecha) : undefined,
        notas,
        tecnico,
        estado,
        urgencia,
      
      },
      include: {
        cliente: true,
        equipo: {
          include: {
            inventario: true
          }
        }
      }
    })

    res.json({
      message: 'Orden de trabajo actualizada exitosamente',
      orden
    })
  } catch (error) {
    console.error('Error al actualizar orden de trabajo:', error)
    res.status(500).json({ 
      error: 'Error al actualizar orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ COMPLETAR ORDEN
export const completarOrden = async (req, res) => {
  try {
    const { id } = req.params

    console.log('🔄 Intentando completar orden:', id)

    // ⭐ VALIDAR ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ ID inválido:', id)
      return res.status(400).json({ 
        error: 'ID de orden inválido',
        receivedId: id
      })
    }

    const ordenId = parseInt(id)
    if (isNaN(ordenId)) {
      console.error('❌ ID no es un número:', id)
      return res.status(400).json({ 
        error: 'ID de orden debe ser un número',
        receivedId: id
      })
    }

    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: ordenId }
    })

    if (!existingOrden) {
      console.error('❌ Orden no encontrada:', ordenId)
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    if (existingOrden.estado === 'completado' || existingOrden.estado === 'completada') {
      return res.status(400).json({ error: 'Esta orden ya está completada' })
    }

    const orden = await prisma.ordenTrabajo.update({
      where: { id: ordenId },
      data: {
        estado: 'completado',
        fechaCompletado: new Date()
      },
      include: {
        cliente: true,
        equipo: {
          include: {
            inventario: true
          }
        }
      }
    })

    console.log(`✅ Orden completada: #${ordenId}`)

    res.json({
      message: 'Orden completada exitosamente',
      orden
    })
  } catch (error) {
    console.error('Error al completar orden:', error)
    res.status(500).json({ 
      error: 'Error al completar orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ ELIMINAR ORDEN
export const deleteOrdenTrabajo = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    await prisma.ordenTrabajo.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Orden de trabajo eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar orden de trabajo:', error)
    res.status(500).json({ 
      error: 'Error al eliminar orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ OBTENER ESTADÍSTICAS
export const getEstadisticas = async (req, res) => {
  try {
    const [total, pendientes, enProceso, completadas] = await Promise.all([
      prisma.ordenTrabajo.count(),
      prisma.ordenTrabajo.count({ where: { estado: 'pendiente' } }),
      prisma.ordenTrabajo.count({ where: { estado: 'en_proceso' } }),
      prisma.ordenTrabajo.count({ where: { estado: { in: ['completado', 'completada'] } } })
    ])

    res.json({
      total,
      pendientes,
      enProceso,
      completadas
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message
    })
  }
}

// ⭐ GENERAR PDF
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📄 Generando PDF de orden #${id}...`)

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        equipo: {
          include: { inventario: true }
        },
        cotizacion: {
          include: {
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
        }
      }
    })

    if (!orden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    // ⭐ Descifrar datos
    if (orden.cliente) {
      try {
        if (orden.cliente.rut_encrypted || 
            orden.cliente.email_encrypted || 
            orden.cliente.telefono_encrypted ||
            orden.cliente.direccion_encrypted) {
          console.log('🔓 Descifrando datos del cliente para PDF...')
          orden.cliente = decryptSensitiveFields(orden.cliente)
          console.log('✅ Datos descifrados exitosamente')
        }
      } catch (decryptError) {
        console.log('⚠️  Error al descifrar:', decryptError.message)
      }
    }

    console.log('📄 Generando PDF para orden:', orden.id)

    const pdfBuffer = await generarPDFOrdenTrabajo(orden)

    // ⭐ NOMBRE PERSONALIZADO
    const clienteNombre = orden.cliente?.nombre.replace(/\s+/g, '-') || 'Cliente'
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = `OT-${orden.id.toString().padStart(6, '0')}-${clienteNombre}-${fecha}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`)
    res.send(pdfBuffer)

  } catch (error) {
    console.error('Error al generar PDF:', error)
    res.status(500).json({ 
      error: 'Error al generar PDF de la orden de trabajo',
      details: error.message
    })
  }
}

// ⭐ CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/ordenes')
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ordenId = req.params.id
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `orden-${ordenId}-firmada-${timestamp}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG y PNG.'), false)
  }
}

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
})

// ⭐ SUBIR DOCUMENTO FIRMADO
export const subirDocumentoFirmado = async (req, res) => {
  try {
    const { id } = req.params

    console.log('📤 Subiendo documento para orden:', id)

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' })
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!orden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    const rutaArchivo = `/uploads/ordenes/${req.file.filename}`

    const ordenActualizada = await prisma.ordenTrabajo.update({
      where: { id: parseInt(id) },
      data: {
        documentoFirmado: rutaArchivo,
        fechaFirma: new Date()
      },
      include: {
        cliente: true,
        equipo: {
          include: {
            inventario: true
          }
        }
      }
    })

    console.log(`✅ Documento subido para orden #${id}`)

    res.json({
      message: 'Documento firmado subido exitosamente',
      orden: ordenActualizada,
      archivo: {
        nombre: req.file.filename,
        ruta: rutaArchivo,
        tamaño: req.file.size,
        tipo: req.file.mimetype
      }
    })

  } catch (error) {
    console.error('Error al subir documento:', error)
    res.status(500).json({ 
      error: 'Error al subir el documento firmado',
      details: error.message
    })
  }
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO
export const descargarDocumentoFirmado = async (req, res) => {
  try {
    const { id } = req.params

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de orden inválido' })
    }

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!orden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    if (!orden.documentoFirmado) {
      return res.status(404).json({ error: 'Esta orden no tiene documento firmado' })
    }

    const filePath = path.join(__dirname, '../..', orden.documentoFirmado)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'El archivo no existe en el servidor' })
    }

    res.download(filePath)

  } catch (error) {
    console.error('Error al descargar documento:', error)
    res.status(500).json({ 
      error: 'Error al descargar el documento',
      details: error.message
    })
  }
}

export default {
  getOrdenesTrabajo,
  getOrdenTrabajoById,
  createOrdenTrabajo,
  updateOrdenTrabajo,
  completarOrden,
  deleteOrdenTrabajo,
  getEstadisticas,
  generarPDF,
  subirDocumentoFirmado,
  descargarDocumentoFirmado,
  upload
}
