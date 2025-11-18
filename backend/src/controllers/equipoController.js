import prisma from '../utils/prisma.js'

// Obtener todos los equipos
export const getEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true
          }
        },
        ordenesTrabajos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(equipos)
  } catch (error) {
    console.error('Error al obtener equipos:', error)
    res.status(500).json({ error: 'Error al obtener equipos' })
  }
}

// ⭐ NUEVO - Obtener equipos por cliente
export const getEquiposByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params

    const equipos = await prisma.equipo.findMany({
      where: {
        clienteId: parseInt(clienteId)
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true
          }
        },
        ordenesTrabajos: {
          select: {
            id: true,
            tipo: true,
            estado: true,
            fecha: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(equipos)
  } catch (error) {
    console.error('Error al obtener equipos del cliente:', error)
    res.status(500).json({ error: 'Error al obtener equipos del cliente' })
  }
}

// Obtener equipo por ID
export const getEquipoById = async (req, res) => {
  try {
    const { id } = req.params

    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        ordenesTrabajos: {
          orderBy: {
            fecha: 'desc'
          }
        }
      }
    })

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' })
    }

    res.json(equipo)
  } catch (error) {
    console.error('Error al obtener equipo:', error)
    res.status(500).json({ error: 'Error al obtener equipo' })
  }
}

// Crear equipo
export const createEquipo = async (req, res) => {
  try {
    const { tipo, marca, modelo, numeroSerie, capacidad, tipoGas, ano, clienteId } = req.body

    // Validar campos requeridos
    if (!tipo || !marca || !modelo || !numeroSerie || !capacidad || !tipoGas || !ano || !clienteId) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Verificar que el número de serie no exista
    const existingEquipo = await prisma.equipo.findUnique({
      where: { numeroSerie }
    })

    if (existingEquipo) {
      return res.status(400).json({ 
        error: 'El número de serie ya está registrado' 
      })
    }

    // Crear equipo
    const equipo = await prisma.equipo.create({
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie,
        capacidad,
        tipoGas,
        ano: parseInt(ano),
        clienteId: parseInt(clienteId)
      },
      include: {
        cliente: true
      }
    })

    res.status(201).json({
      message: 'Equipo creado exitosamente',
      equipo
    })
  } catch (error) {
    console.error('Error al crear equipo:', error)
    res.status(500).json({ error: 'Error al crear equipo' })
  }
}

// Actualizar equipo
export const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, marca, modelo, numeroSerie, capacidad, tipoGas, ano, clienteId } = req.body

    // Verificar que el equipo existe
    const existingEquipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingEquipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' })
    }

    // Si se actualiza el número de serie, verificar que no exista
    if (numeroSerie && numeroSerie !== existingEquipo.numeroSerie) {
      const serieExists = await prisma.equipo.findUnique({
        where: { numeroSerie }
      })

      if (serieExists) {
        return res.status(400).json({ 
          error: 'El número de serie ya está registrado' 
        })
      }
    }

    // Actualizar equipo
    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie,
        capacidad,
        tipoGas,
        ano: parseInt(ano),
        clienteId: parseInt(clienteId)
      },
      include: {
        cliente: true
      }
    })

    res.json({
      message: 'Equipo actualizado exitosamente',
      equipo
    })
  } catch (error) {
    console.error('Error al actualizar equipo:', error)
    res.status(500).json({ error: 'Error al actualizar equipo' })
  }
}

// Eliminar equipo
export const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el equipo existe
    const existingEquipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        ordenesTrabajos: true
      }
    })

    if (!existingEquipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' })
    }

    // Verificar si tiene órdenes asociadas
    if (existingEquipo.ordenesTrabajos.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el equipo porque tiene órdenes de trabajo asociadas' 
      })
    }

    // Eliminar equipo
    await prisma.equipo.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Equipo eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar equipo:', error)
    res.status(500).json({ error: 'Error al eliminar equipo' })
  }
}

export default {
  getEquipos,
  getEquiposByCliente, // ⭐ NUEVO
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo
}