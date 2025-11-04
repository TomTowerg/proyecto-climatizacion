import prisma from '../utils/prisma.js'

// Obtener todo el inventario
export const getInventario = async (req, res) => {
  try {
    const inventario = await prisma.inventario.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(inventario)
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    res.status(500).json({ error: 'Error al obtener inventario' })
  }
}

// Obtener item por ID
export const getInventarioById = async (req, res) => {
  try {
    const { id } = req.params

    const item = await prisma.inventario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' })
    }

    res.json(item)
  } catch (error) {
    console.error('Error al obtener item:', error)
    res.status(500).json({ error: 'Error al obtener item' })
  }
}

// Crear item en inventario
export const createInventario = async (req, res) => {
  try {
    const { tipo, marca, modelo, numeroSerie, capacidad, tipoGas, ano, precioCompra, precioVenta, stock } = req.body

    // Validar campos requeridos
    if (!tipo || !marca || !modelo || !numeroSerie || !capacidad || !tipoGas || !ano || !precioCompra || !precioVenta) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Verificar que el número de serie no exista
    const existingItem = await prisma.inventario.findUnique({
      where: { numeroSerie }
    })

    if (existingItem) {
      return res.status(400).json({ 
        error: 'El número de serie ya está registrado' 
      })
    }

    // Crear item
    const item = await prisma.inventario.create({
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie,
        capacidad,
        tipoGas,
        ano: parseInt(ano),
        precioCompra: parseFloat(precioCompra),
        precioVenta: parseFloat(precioVenta),
        stock: stock ? parseInt(stock) : 1
      }
    })

    res.status(201).json({
      message: 'Item agregado al inventario exitosamente',
      item
    })
  } catch (error) {
    console.error('Error al crear item:', error)
    res.status(500).json({ error: 'Error al crear item' })
  }
}

// Actualizar item
export const updateInventario = async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, marca, modelo, numeroSerie, capacidad, tipoGas, ano, precioCompra, precioVenta, stock, estado } = req.body

    const existingItem = await prisma.inventario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Item no encontrado' })
    }

    // Verificar número de serie si cambió
    if (numeroSerie && numeroSerie !== existingItem.numeroSerie) {
      const serieExists = await prisma.inventario.findUnique({
        where: { numeroSerie }
      })

      if (serieExists) {
        return res.status(400).json({ 
          error: 'El número de serie ya está registrado' 
        })
      }
    }

    const item = await prisma.inventario.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie,
        capacidad,
        tipoGas,
        ano: ano ? parseInt(ano) : existingItem.ano,
        precioCompra: precioCompra ? parseFloat(precioCompra) : existingItem.precioCompra,
        precioVenta: precioVenta ? parseFloat(precioVenta) : existingItem.precioVenta,
        stock: stock !== undefined ? parseInt(stock) : existingItem.stock,
        estado: estado || existingItem.estado
      }
    })

    res.json({
      message: 'Item actualizado exitosamente',
      item
    })
  } catch (error) {
    console.error('Error al actualizar item:', error)
    res.status(500).json({ error: 'Error al actualizar item' })
  }
}

// Eliminar item
export const deleteInventario = async (req, res) => {
  try {
    const { id } = req.params

    const existingItem = await prisma.inventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        cotizaciones: true
      }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Item no encontrado' })
    }

    // Verificar si tiene cotizaciones pendientes
    const cotizacionesPendientes = existingItem.cotizaciones.filter(c => c.estado === 'pendiente')
    if (cotizacionesPendientes.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el item porque tiene cotizaciones pendientes' 
      })
    }

    await prisma.inventario.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Item eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar item:', error)
    res.status(500).json({ error: 'Error al eliminar item' })
  }
}