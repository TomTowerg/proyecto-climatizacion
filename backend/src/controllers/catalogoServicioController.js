import prisma from '../utils/prisma.js'

export const getCatalogoServicios = async (req, res) => {
  try {
    const { categoria } = req.query
    const where = { activo: true }
    if (categoria) where.categoria = categoria

    const items = await prisma.catalogoServicio.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }]
    })
    res.json(items)
  } catch (error) {
    console.error('Error al obtener catálogo de servicios:', error)
    res.status(500).json({ error: 'Error al obtener catálogo de servicios' })
  }
}

export const createCatalogoServicio = async (req, res) => {
  try {
    const { categoria, nombre, precio } = req.body

    if (!categoria || !nombre || precio === undefined) {
      return res.status(400).json({ error: 'categoria, nombre y precio son requeridos' })
    }

    const item = await prisma.catalogoServicio.create({
      data: {
        categoria: categoria.trim(),
        nombre: nombre.trim(),
        precio: parseFloat(precio)
      }
    })
    res.status(201).json(item)
  } catch (error) {
    console.error('Error al crear catálogo de servicio:', error)
    res.status(500).json({ error: 'Error al crear catálogo de servicio' })
  }
}
