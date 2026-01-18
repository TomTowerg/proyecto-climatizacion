import prisma from '../utils/prisma.js'
import { decryptSensitiveFields } from '../utils/encryption.js'
import { generarPDFOrdenTrabajo } from '../services/ordenTrabajoPDFService.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Obtener todas las órdenes de trabajo
export const getOrdenesTrabajo = async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            telefono: true
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
        fecha: 'desc'
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
    res.status(500).json({ error: 'Error al obtener órdenes de trabajo' })
  }
}

// Obtener orden de trabajo por ID
export const getOrdenTrabajoById = async (req, res) => {
  try {
    const { id } = req.params

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
    res.status(500).json({ error: 'Error al obtener orden de trabajo' })
  }
}

// Crear orden de trabajo
export const createOrdenTrabajo = async (req, res) => {
  try {
    const { clienteId, equipoId, tipo, fecha, notas, tecnico, estado, urgencia, analisisIA } = req.body

    console.log('📝 Creando orden con análisis:', analisisIA)

    if (!clienteId || !tipo || !fecha || !tecnico) {
      return res.status(400).json({ 
        error: 'Cliente, tipo, fecha y técnico son requeridos' 
      })
    }

    const tiposValidos = ['instalacion', 'mantenimiento', 'reparacion']
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo de orden inválido. Debe ser: instalacion, mantenimiento o reparacion' 
      })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    if (equipoId) {
      const equipo = await prisma.equipo.findUnique({
        where: { id: parseInt(equipoId) }
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

    const orden = await prisma.ordenTrabajo.create({
      data: {
        clienteId: parseInt(clienteId),
        equipoId: equipoId ? parseInt(equipoId) : null,
        tipo,
        fecha: new Date(fecha),
        notas: notas || '',
        tecnico,
        estado: estado || 'pendiente',
        urgencia: urgencia || 'media',
        analisisIA: analisisIA ? JSON.stringify(analisisIA) : null
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

    console.log('✅ Orden creada con urgencia:', orden.urgencia)

    res.status(201).json({
      message: 'Orden de trabajo creada exitosamente',
      orden
    })
  } catch (error) {
    console.error('Error al crear orden de trabajo:', error)
    res.status(500).json({ error: 'Error al crear orden de trabajo' })
  }
}

// Actualizar orden de trabajo
export const updateOrdenTrabajo = async (req, res) => {
  try {
    const { id } = req.params
    const { clienteId, equipoId, tipo, fecha, notas, tecnico, estado, urgencia, analisisIA } = req.body

    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    if (tipo) {
      const tiposValidos = ['instalacion', 'mantenimiento', 'reparacion']
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ 
          error: 'Tipo de orden inválido' 
        })
      }
    }

    if (estado) {
      const estadosValidos = ['pendiente', 'en_proceso', 'completado']
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido. Debe ser: pendiente, en_proceso o completado' 
        })
      }
    }

    if (urgencia) {
      const urgenciasValidas = ['baja', 'media', 'critica']
      if (!urgenciasValidas.includes(urgencia)) {
        return res.status(400).json({ 
          error: 'Urgencia inválida. Debe ser: baja, media o critica' 
        })
      }
    }

    const orden = await prisma.ordenTrabajo.update({
      where: { id: parseInt(id) },
      data: {
        clienteId: clienteId ? parseInt(clienteId) : existingOrden.clienteId,
        equipoId: equipoId ? parseInt(equipoId) : existingOrden.equipoId,
        tipo: tipo || existingOrden.tipo,
        fecha: fecha ? new Date(fecha) : existingOrden.fecha,
        notas: notas !== undefined ? notas : existingOrden.notas,
        tecnico: tecnico || existingOrden.tecnico,
        estado: estado || existingOrden.estado,
        urgencia: urgencia || existingOrden.urgencia,
        analisisIA: analisisIA ? JSON.stringify(analisisIA) : existingOrden.analisisIA
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
    res.status(500).json({ error: 'Error al actualizar orden de trabajo' })
  }
}

// Completar orden de trabajo
export const completarOrden = async (req, res) => {
  try {
    const { id } = req.params

    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    if (existingOrden.estado === 'completado') {
      return res.status(400).json({ error: 'Esta orden ya está completada' })
    }

    const orden = await prisma.ordenTrabajo.update({
      where: { id: parseInt(id) },
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

    res.json({
      message: 'Orden completada exitosamente',
      orden
    })
  } catch (error) {
    console.error('Error al completar orden:', error)
    res.status(500).json({ error: 'Error al completar orden de trabajo' })
  }
}

// Eliminar orden de trabajo
export const deleteOrdenTrabajo = async (req, res) => {
  try {
    const { id } = req.params

    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    await prisma.ordenTrabajo.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Orden de trabajo eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar orden de trabajo:', error)
    res.status(500).json({ error: 'Error al eliminar orden de trabajo' })
  }
}

// Obtener estadísticas
export const getEstadisticas = async (req, res) => {
  try {
    const totalClientes = await prisma.cliente.count()
    const totalEquipos = await prisma.equipo.count()
    
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    
    const finMes = new Date()
    finMes.setMonth(finMes.getMonth() + 1)
    finMes.setDate(0)
    finMes.setHours(23, 59, 59, 999)
    
    const ordenesMes = await prisma.ordenTrabajo.count({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes
        }
      }
    })
    
    const mantenimientosCompletados = await prisma.ordenTrabajo.count({
      where: {
        tipo: 'mantenimiento',
        estado: 'completado'
      }
    })

    res.json({
      totalClientes,
      totalEquipos,
      ordenesMes,
      mantenimientosCompletados
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

//  GENERAR PDF DE ORDEN DE TRABAJO
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params

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

    // ⭐ DESCIFRAR DATOS DEL CLIENTE ANTES DE GENERAR PDF
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
        console.log('⚠️  Error al descifrar, usando datos sin cifrar:', decryptError.message)
      }
    }

    console.log('📄 Generando PDF para orden:', orden.id)

    const pdfBuffer = await generarPDFOrdenTrabajo(orden)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=orden-trabajo-${orden.id}.pdf`)
    res.send(pdfBuffer)

  } catch (error) {
    console.error('Error al generar PDF:', error)
    res.status(500).json({ error: 'Error al generar PDF de la orden de trabajo' })
  }
}

// ⭐ CONFIGURACIÓN DE MULTER PARA SUBIDA DE ARCHIVOS
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
    res.status(500).json({ error: 'Error al subir el documento firmado' })
  }
}

// ⭐ DESCARGAR DOCUMENTO FIRMADO
export const descargarDocumentoFirmado = async (req, res) => {
  try {
    const { id } = req.params

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
    res.status(500).json({ error: 'Error al descargar el documento' })
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