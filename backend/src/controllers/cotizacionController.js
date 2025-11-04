import prisma from '../utils/prisma.js'

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
            capacidad: true,
            precioVenta: true
          }
        }
      },
      orderBy: {
        fechaCotizacion: 'desc'
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
        inventario: true
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

// Crear cotización
export const createCotizacion = async (req, res) => {
  try {
    const { clienteId, inventarioId, precioOfertado, descuento, notas } = req.body

    if (!clienteId || !inventarioId || !precioOfertado) {
      return res.status(400).json({ 
        error: 'Cliente, equipo y precio son requeridos' 
      })
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Verificar que el equipo existe y está disponible
    const equipo = await prisma.inventario.findUnique({
      where: { id: parseInt(inventarioId) }
    })

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado en inventario' })
    }

    if (equipo.estado === 'vendido') {
      return res.status(400).json({ 
        error: 'El equipo ya fue vendido' 
      })
    }

    // Calcular precio final
    const desc = descuento || 0
    const precioFinal = parseFloat(precioOfertado) - (parseFloat(precioOfertado) * (desc / 100))

    // Crear cotización
    const cotizacion = await prisma.cotizacion.create({
      data: {
        clienteId: parseInt(clienteId),
        inventarioId: parseInt(inventarioId),
        precioOfertado: parseFloat(precioOfertado),
        descuento: desc,
        precioFinal,
        notas: notas || ''
      },
      include: {
        cliente: true,
        inventario: true
      }
    })

    // Actualizar estado del equipo a reservado
    await prisma.inventario.update({
      where: { id: parseInt(inventarioId) },
      data: { estado: 'reservado' }
    })

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al crear cotización:', error)
    res.status(500).json({ error: 'Error al crear cotización' })
  }
}

// Actualizar cotización (cambiar estado, precio, etc)
export const updateCotizacion = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, precioOfertado, descuento, notas, fechaRespuesta } = req.body

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: { inventario: true }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Calcular nuevo precio final si cambió
    const desc = descuento !== undefined ? descuento : existingCotizacion.descuento
    const precio = precioOfertado !== undefined ? precioOfertado : existingCotizacion.precioOfertado
    const precioFinal = precio - (precio * (desc / 100))

    const updateData = {
      precioOfertado: parseFloat(precio),
      descuento: desc,
      precioFinal,
      notas: notas !== undefined ? notas : existingCotizacion.notas,
      estado: estado || existingCotizacion.estado
    }

    if (fechaRespuesta) {
      updateData.fechaRespuesta = new Date(fechaRespuesta)
    }

    const cotizacion = await prisma.cotizacion.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        cliente: true,
        inventario: true
      }
    })

    // Si se rechaza, liberar el equipo
    if (estado === 'rechazada') {
      await prisma.inventario.update({
        where: { id: existingCotizacion.inventarioId },
        data: { estado: 'disponible' }
      })
    }

    // Si se aprueba, marcar equipo como vendido
    if (estado === 'aprobada') {
      await prisma.inventario.update({
        where: { id: existingCotizacion.inventarioId },
        data: { estado: 'vendido', stock: 0 }
      })
    }

    res.json({
      message: 'Cotización actualizada exitosamente',
      cotizacion
    })
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    res.status(500).json({ error: 'Error al actualizar cotización' })
  }
}

// Eliminar cotización
export const deleteCotizacion = async (req, res) => {
  try {
    const { id } = req.params

    const existingCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' })
    }

    // Liberar el equipo si está reservado
    if (existingCotizacion.estado === 'pendiente') {
      await prisma.inventario.update({
        where: { id: existingCotizacion.inventarioId },
        data: { estado: 'disponible' }
      })
    }

    await prisma.cotizacion.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Cotización eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    res.status(500).json({ error: 'Error al eliminar cotización' })
  }
}