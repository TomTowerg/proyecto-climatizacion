import prisma from '../utils/prisma.js'

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
            numeroSerie: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    res.json(ordenes)
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
        equipo: true
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

    // Validar campos requeridos
    if (!clienteId || !tipo || !fecha || !tecnico) {
      return res.status(400).json({ 
        error: 'Cliente, tipo, fecha y técnico son requeridos' 
      })
    }

    // Validar tipo
    const tiposValidos = ['instalacion', 'mantenimiento', 'reparacion']
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        error: 'Tipo de orden inválido. Debe ser: instalacion, mantenimiento o reparacion' 
      })
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Si hay equipoId, verificar que existe y pertenece al cliente
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

    // Crear orden de trabajo
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
        equipo: true
      }
    })

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

    // Verificar que la orden existe
    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    // Validar tipo si se proporciona
    if (tipo) {
      const tiposValidos = ['instalacion', 'mantenimiento', 'reparacion']
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ 
          error: 'Tipo de orden inválido' 
        })
      }
    }

    // Validar estado si se proporciona
    if (estado) {
      const estadosValidos = ['pendiente', 'en_proceso', 'completado']
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido. Debe ser: pendiente, en_proceso o completado' 
        })
      }
    }

    // Validar urgencia si se proporciona
    if (urgencia) {
      const urgenciasValidas = ['baja', 'media', 'critica']
      if (!urgenciasValidas.includes(urgencia)) {
        return res.status(400).json({ 
          error: 'Urgencia inválida. Debe ser: baja, media o critica' 
        })
      }
    }

    // Actualizar orden de trabajo
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
        equipo: true
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

// Eliminar orden de trabajo
export const deleteOrdenTrabajo = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que la orden existe
    const existingOrden = await prisma.ordenTrabajo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrden) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' })
    }

    // Eliminar orden de trabajo
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
    
    // Órdenes del mes actual
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