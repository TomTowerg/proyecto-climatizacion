import prisma from '../utils/prisma.js'
import { parsePagination, paginatedResponse, parseSearch } from '../utils/pagination.js'

/**
 * CONTROLADOR DE INVENTARIO DE MATERIALES
 */

// ⭐ OBTENER TODOS LOS MATERIALES
export const getMateriales = async (req, res) => {
  try {
    const pagination = parsePagination(req.query)
    const search = parseSearch(req.query)

    const queryOptions = {
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' }
      ],
      include: {
        _count: {
          select: { materialesUsados: true }
        }
      }
    }

    // Construir WHERE para búsqueda
    if (search) {
      queryOptions.where = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
          { proveedor: { contains: search, mode: 'insensitive' } },
          { codigoProducto: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (pagination) {
      const [materiales, total] = await Promise.all([
        prisma.materialInventario.findMany({
          ...queryOptions,
          skip: pagination.skip,
          take: pagination.take
        }),
        prisma.materialInventario.count({ where: queryOptions.where })
      ])

      return res.json(paginatedResponse(materiales, total, pagination))
    }

    // Sin paginación: devolver todo (retrocompatible)
    const materiales = await prisma.materialInventario.findMany(queryOptions)
    res.json(materiales)
  } catch (error) {
    console.error('Error al obtener materiales:', error)
    res.status(500).json({
      error: 'Error al obtener materiales',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ OBTENER MATERIAL POR ID
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params

    const material = await prisma.materialInventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        materialesUsados: {
          include: {
            cotizacion: {
              select: {
                id: true,
                cliente: {
                  select: {
                    nombre: true
                  }
                },
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimos 10 usos
        }
      }
    })

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' })
    }

    res.json(material)
  } catch (error) {
    console.error('Error al obtener material:', error)
    res.status(500).json({
      error: 'Error al obtener material',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ CREAR MATERIAL
export const createMaterial = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      unidad,
      precioNeto,
      precioConIVA,
      stock,
      stockMinimo,
      proveedor,
      codigoProducto,
      descripcion,
      imagen
    } = req.body

    console.log('📝 Creando material:', nombre)

    // Validaciones
    if (!nombre || !categoria || !unidad || !precioNeto) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: nombre, categoria, unidad, precioNeto'
      })
    }

    // Calcular precio con IVA si no viene
    const precioIVA = precioConIVA || (precioNeto * 1.19)

    const material = await prisma.materialInventario.create({
      data: {
        nombre,
        categoria,
        unidad,
        precioNeto: parseFloat(precioNeto),
        precioConIVA: parseFloat(precioIVA),
        stock: stock ? parseInt(stock) : 0,
        stockMinimo: stockMinimo ? parseInt(stockMinimo) : 5,
        proveedor: proveedor || null,
        codigoProducto: codigoProducto || null,
        descripcion: descripcion || null,
        imagen: imagen || null
      }
    })

    console.log(`✅ Material creado: #${material.id}`)

    res.status(201).json({
      message: 'Material creado exitosamente',
      material
    })
  } catch (error) {
    console.error('Error al crear material:', error)

    // Error de código duplicado
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un material con ese código de producto'
      })
    }

    res.status(500).json({
      error: 'Error al crear material',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ ACTUALIZAR MATERIAL
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const {
      nombre,
      categoria,
      unidad,
      precioNeto,
      precioConIVA,
      stock,
      stockMinimo,
      proveedor,
      codigoProducto,
      descripcion,
      imagen,
      activo
    } = req.body

    console.log(`📝 Actualizando material #${id}`)

    // Verificar que existe
    const existing = await prisma.materialInventario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Material no encontrado' })
    }

    // Preparar datos para actualizar
    const dataToUpdate = {}

    if (nombre !== undefined) dataToUpdate.nombre = nombre
    if (categoria !== undefined) dataToUpdate.categoria = categoria
    if (unidad !== undefined) dataToUpdate.unidad = unidad
    if (precioNeto !== undefined) {
      dataToUpdate.precioNeto = parseFloat(precioNeto)
      // Auto-calcular IVA si no viene especificado
      if (precioConIVA === undefined) {
        dataToUpdate.precioConIVA = parseFloat(precioNeto) * 1.19
      }
    }
    if (precioConIVA !== undefined) dataToUpdate.precioConIVA = parseFloat(precioConIVA)
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock)
    if (stockMinimo !== undefined) dataToUpdate.stockMinimo = parseInt(stockMinimo)
    if (proveedor !== undefined) dataToUpdate.proveedor = proveedor
    if (codigoProducto !== undefined) dataToUpdate.codigoProducto = codigoProducto
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion
    if (imagen !== undefined) dataToUpdate.imagen = imagen
    if (activo !== undefined) dataToUpdate.activo = activo

    const material = await prisma.materialInventario.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    console.log(`✅ Material actualizado: #${id}`)

    res.json({
      message: 'Material actualizado exitosamente',
      material
    })
  } catch (error) {
    console.error('Error al actualizar material:', error)

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un material con ese código de producto'
      })
    }

    res.status(500).json({
      error: 'Error al actualizar material',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ ELIMINAR MATERIAL
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`🗑️  Eliminando material #${id}`)

    // Verificar que existe
    const existing = await prisma.materialInventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { materialesUsados: true }
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Material no encontrado' })
    }

    // Si tiene uso en cotizaciones, mejor desactivar en lugar de eliminar
    if (existing._count.materialesUsados > 0) {
      const material = await prisma.materialInventario.update({
        where: { id: parseInt(id) },
        data: { activo: false }
      })

      console.log(`✅ Material desactivado (tiene ${existing._count.materialesUsados} usos): #${id}`)

      return res.json({
        message: 'Material desactivado (tiene registros asociados)',
        material
      })
    }

    // Si no tiene usos, eliminar permanentemente
    await prisma.materialInventario.delete({
      where: { id: parseInt(id) }
    })

    console.log(`✅ Material eliminado: #${id}`)

    res.json({ message: 'Material eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar material:', error)
    res.status(500).json({
      error: 'Error al eliminar material',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ AJUSTAR STOCK (aumentar o disminuir)
export const ajustarStock = async (req, res) => {
  try {
    const { id } = req.params
    const { cantidad, tipo, motivo } = req.body

    console.log(`📦 Ajustando stock de material #${id}: ${tipo} ${cantidad}`)

    // Validaciones
    if (!cantidad || !tipo) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: cantidad, tipo (aumentar/disminuir)'
      })
    }

    const material = await prisma.materialInventario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' })
    }

    const cantidadNum = parseInt(cantidad)
    let nuevoStock = material.stock

    if (tipo === 'aumentar') {
      nuevoStock += cantidadNum
    } else if (tipo === 'disminuir') {
      nuevoStock -= cantidadNum
      if (nuevoStock < 0) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          stockActual: material.stock,
          solicitado: cantidadNum
        })
      }
    } else {
      return res.status(400).json({
        error: 'Tipo inválido. Debe ser "aumentar" o "disminuir"'
      })
    }

    const materialActualizado = await prisma.materialInventario.update({
      where: { id: parseInt(id) },
      data: { stock: nuevoStock }
    })

    console.log(`✅ Stock ajustado: ${material.stock} → ${nuevoStock}`)

    res.json({
      message: `Stock ${tipo === 'aumentar' ? 'aumentado' : 'disminuido'} exitosamente`,
      material: materialActualizado,
      ajuste: {
        anterior: material.stock,
        cantidad: cantidadNum,
        nuevo: nuevoStock,
        motivo: motivo || 'Sin especificar'
      }
    })
  } catch (error) {
    console.error('Error al ajustar stock:', error)
    res.status(500).json({
      error: 'Error al ajustar stock',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ OBTENER MATERIALES CON STOCK BAJO
export const getMaterialesStockBajo = async (req, res) => {
  try {
    const materiales = await prisma.materialInventario.findMany({
      where: {
        activo: true,
        stock: {
          lte: prisma.materialInventario.fields.stockMinimo
        }
      },
      orderBy: { stock: 'asc' }
    })

    console.log(`⚠️  ${materiales.length} materiales con stock bajo`)

    res.json(materiales)
  } catch (error) {
    console.error('Error al obtener materiales con stock bajo:', error)
    res.status(500).json({
      error: 'Error al obtener materiales con stock bajo',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// ⭐ OBTENER ESTADÍSTICAS
export const getEstadisticas = async (req, res) => {
  try {
    const [total, activos, stockBajo, sinStock] = await Promise.all([
      prisma.materialInventario.count(),
      prisma.materialInventario.count({ where: { activo: true } }),
      prisma.materialInventario.count({
        where: {
          activo: true,
          stock: {
            lte: prisma.materialInventario.fields.stockMinimo
          }
        }
      }),
      prisma.materialInventario.count({
        where: {
          activo: true,
          stock: 0
        }
      })
    ])

    // Valor total del inventario
    const materiales = await prisma.materialInventario.findMany({
      where: { activo: true }
    })

    const valorTotal = materiales.reduce((sum, mat) => {
      return sum + (mat.precioConIVA * mat.stock)
    }, 0)

    res.json({
      total,
      activos,
      inactivos: total - activos,
      stockBajo,
      sinStock,
      valorTotal
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

export default {
  getMateriales,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStock,
  getMaterialesStockBajo,
  getEstadisticas
}