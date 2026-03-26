import prisma from '../utils/prisma.js'
import { parsePagination, paginatedResponse, parseSearch } from '../utils/pagination.js'

// Obtener todos los equipos (con paginación y búsqueda opcionales)
export const getEquipos = async (req, res) => {
  try {
    const pagination = parsePagination(req.query)
    const searchTerm = parseSearch(req.query)

    const where = searchTerm ? {
      OR: [
        { tipo: { contains: searchTerm, mode: 'insensitive' } },
        { marca: { contains: searchTerm, mode: 'insensitive' } },
        { modelo: { contains: searchTerm, mode: 'insensitive' } },
        { numeroSerie: { contains: searchTerm, mode: 'insensitive' } },
        { cliente: { nombre: { contains: searchTerm, mode: 'insensitive' } } }
      ]
    } : {}

    const includeRelations = {
      cliente: {
        select: {
          id: true,
          nombre: true,
          rut: true
        }
      },
      ordenesTrabajos: true
    }

    if (pagination) {
      const [equipos, total] = await Promise.all([
        prisma.equipo.findMany({
          where,
          include: includeRelations,
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take
        }),
        prisma.equipo.count({ where })
      ])
      return res.json(paginatedResponse(equipos, total, pagination))
    }

    // Sin paginación (retrocompatible)
    const equipos = await prisma.equipo.findMany({
      where,
      include: includeRelations,
      orderBy: { createdAt: 'desc' }
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

// Normaliza un campo opcional: convierte string vacío en null
const toOptional = (val) => (val === '' || val === undefined ? null : val)

// Crear equipo
export const createEquipo = async (req, res) => {
  try {
    const { tipo, marca, modelo, numeroSerie, capacidad, tipoGas, ano, clienteId } = req.body

    // Solo tipo, capacidad y clienteId son requeridos
    if (!tipo || !capacidad || !clienteId) {
      return res.status(400).json({
        error: 'Los campos tipo, capacidad y cliente son requeridos'
      })
    }

    const serieNormalizado = toOptional(numeroSerie)

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Verificar unicidad del número de serie solo si se proporcionó
    if (serieNormalizado) {
      const existingEquipo = await prisma.equipo.findUnique({
        where: { numeroSerie: serieNormalizado }
      })
      if (existingEquipo) {
        return res.status(400).json({ error: 'El número de serie ya está registrado' })
      }
    }

    // Crear equipo
    const equipo = await prisma.equipo.create({
      data: {
        tipo,
        marca: toOptional(marca),
        modelo: toOptional(modelo),
        numeroSerie: serieNormalizado,
        capacidad,
        tipoGas: toOptional(tipoGas),
        ano: ano ? parseInt(ano) : null,
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

    const serieNormalizado = toOptional(numeroSerie)

    // Si se actualiza el número de serie, verificar que no exista en otro equipo
    if (serieNormalizado && serieNormalizado !== existingEquipo.numeroSerie) {
      const serieExists = await prisma.equipo.findUnique({
        where: { numeroSerie: serieNormalizado }
      })
      if (serieExists) {
        return res.status(400).json({ error: 'El número de serie ya está registrado' })
      }
    }

    // Actualizar equipo
    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        marca: toOptional(marca),
        modelo: toOptional(modelo),
        numeroSerie: serieNormalizado,
        capacidad,
        tipoGas: toOptional(tipoGas),
        ano: ano ? parseInt(ano) : null,
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