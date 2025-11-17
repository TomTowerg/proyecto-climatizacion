import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * SERVICIO DE GESTIÓN DE STOCK
 * Maneja todas las operaciones relacionadas con el inventario
 */

/**
 * Verificar si hay stock disponible
 */
export const verificarStock = async (inventarioId, cantidad = 1) => {
  try {
    const producto = await prisma.inventario.findUnique({
      where: { id: inventarioId }
    })

    if (!producto) {
      return {
        disponible: false,
        error: 'Producto no encontrado en inventario'
      }
    }

    if (producto.estado === 'agotado') {
      return {
        disponible: false,
        error: 'Producto agotado'
      }
    }

    if (producto.stock < cantidad) {
      return {
        disponible: false,
        error: `Stock insuficiente. Disponible: ${producto.stock}, Requerido: ${cantidad}`
      }
    }

    return {
      disponible: true,
      producto,
      stockDisponible: producto.stock
    }
  } catch (error) {
    console.error('Error al verificar stock:', error)
    throw error
  }
}

/**
 * Reducir stock de un producto
 */
export const reducirStock = async (inventarioId, cantidad = 1) => {
  try {
    // Verificar stock disponible
    const verificacion = await verificarStock(inventarioId, cantidad)
    
    if (!verificacion.disponible) {
      throw new Error(verificacion.error)
    }

    // Actualizar stock
    const productoActualizado = await prisma.inventario.update({
      where: { id: inventarioId },
      data: {
        stock: {
          decrement: cantidad
        },
        // Si el stock llega a 0, marcar como agotado
        estado: verificacion.producto.stock - cantidad === 0 ? 'agotado' : 'disponible'
      }
    })

    console.log(`✅ Stock reducido: ${verificacion.producto.marca} ${verificacion.producto.modelo}`)
    console.log(`   Stock anterior: ${verificacion.producto.stock} → Nuevo: ${productoActualizado.stock}`)

    return {
      success: true,
      producto: productoActualizado,
      stockAnterior: verificacion.producto.stock,
      stockNuevo: productoActualizado.stock
    }
  } catch (error) {
    console.error('Error al reducir stock:', error)
    throw error
  }
}

/**
 * Aumentar stock de un producto (devoluciones, reposiciones)
 */
export const aumentarStock = async (inventarioId, cantidad = 1) => {
  try {
    const producto = await prisma.inventario.findUnique({
      where: { id: inventarioId }
    })

    if (!producto) {
      throw new Error('Producto no encontrado')
    }

    const productoActualizado = await prisma.inventario.update({
      where: { id: inventarioId },
      data: {
        stock: {
          increment: cantidad
        },
        estado: 'disponible' // Si se aumenta stock, ya no está agotado
      }
    })

    console.log(`✅ Stock aumentado: ${producto.marca} ${producto.modelo}`)
    console.log(`   Stock anterior: ${producto.stock} → Nuevo: ${productoActualizado.stock}`)

    return {
      success: true,
      producto: productoActualizado,
      stockAnterior: producto.stock,
      stockNuevo: productoActualizado.stock
    }
  } catch (error) {
    console.error('Error al aumentar stock:', error)
    throw error
  }
}

/**
 * Obtener productos con stock bajo (alertas)
 */
export const obtenerStockBajo = async (umbral = 3) => {
  try {
    const productosStockBajo = await prisma.inventario.findMany({
      where: {
        stock: {
          lte: umbral,
          gt: 0
        },
        estado: 'disponible'
      },
      orderBy: {
        stock: 'asc'
      }
    })

    return productosStockBajo
  } catch (error) {
    console.error('Error al obtener stock bajo:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de inventario
 */
export const obtenerEstadisticasInventario = async () => {
  try {
    const total = await prisma.inventario.count()
    const disponibles = await prisma.inventario.count({
      where: { estado: 'disponible', stock: { gt: 0 } }
    })
    const agotados = await prisma.inventario.count({
      where: { 
        OR: [
          { estado: 'agotado' },
          { stock: 0 }
        ]
      }
    })
    const stockBajo = await prisma.inventario.count({
      where: { 
        stock: { lte: 3, gt: 0 },
        estado: 'disponible'
      }
    })

    const valorTotal = await prisma.inventario.aggregate({
      _sum: {
        precioCliente: true
      },
      where: {
        estado: 'disponible'
      }
    })

    return {
      total,
      disponibles,
      agotados,
      stockBajo,
      valorTotalInventario: valorTotal._sum.precioCliente || 0
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    throw error
  }
}

export default {
  verificarStock,
  reducirStock,
  aumentarStock,
  obtenerStockBajo,
  obtenerEstadisticasInventario
}