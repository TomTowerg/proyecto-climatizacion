import prisma from '../utils/prisma.js'

/**
 * CONTROLADOR DE TIPOS DE INSTALACIÓN
 * Catálogo reutilizable de tipos de instalación con precios
 */

export const getTiposInstalacion = async (req, res) => {
  try {
    const tiposInstalacion = await prisma.tipoInstalacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    })

    res.json(tiposInstalacion)
  } catch (error) {
    console.error('Error al obtener tipos de instalación:', error)
    res.status(500).json({
      error: 'Error al obtener tipos de instalación',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

export const createTipoInstalacion = async (req, res) => {
  try {
    const { nombre, descripcion, precio } = req.body

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' })
    }

    const tipoInstalacion = await prisma.tipoInstalacion.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio: parseFloat(precio)
      }
    })

    res.status(201).json(tipoInstalacion)
  } catch (error) {
    console.error('Error al crear tipo de instalación:', error)
    res.status(500).json({
      error: 'Error al crear tipo de instalación',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

export const updateTipoInstalacion = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, precio } = req.body

    const tipoInstalacion = await prisma.tipoInstalacion.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(precio !== undefined && { precio: parseFloat(precio) })
      }
    })

    res.json(tipoInstalacion)
  } catch (error) {
    console.error('Error al actualizar tipo de instalación:', error)
    res.status(500).json({
      error: 'Error al actualizar tipo de instalación',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

export const deleteTipoInstalacion = async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete: desactivar
    await prisma.tipoInstalacion.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    })

    res.json({ message: 'Tipo de instalación desactivado' })
  } catch (error) {
    console.error('Error al eliminar tipo de instalación:', error)
    res.status(500).json({
      error: 'Error al eliminar tipo de instalación',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}
