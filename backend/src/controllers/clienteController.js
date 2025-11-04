import prisma from '../utils/prisma.js'
import { validarRut } from '../utils/rutValidator.js'

// Obtener todos los clientes
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        equipos: true,
        ordenesTrabajos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(clientes)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

// Obtener un cliente por ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        ordenesTrabajos: true
      }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    res.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    res.status(500).json({ error: 'Error al obtener cliente' })
  }
}

// Crear cliente
export const createCliente = async (req, res) => {
  try {
    const { nombre, rut, email, telefono, direccion } = req.body

    // Validar campos requeridos
    if (!nombre || !rut || !email || !telefono || !direccion) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Validar RUT chileno
    if (!validarRut(rut)) {
      return res.status(400).json({ 
        error: 'RUT inválido' 
      })
    }

    // Verificar si el RUT ya existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { rut }
    })

    if (existingCliente) {
      return res.status(400).json({ 
        error: 'El RUT ya está registrado' 
      })
    }

    // Crear cliente
    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        rut,
        email,
        telefono,
        direccion
      }
    })

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      cliente
    })
  } catch (error) {
    console.error('Error al crear cliente:', error)
    res.status(500).json({ error: 'Error al crear cliente' })
  }
}

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, rut, email, telefono, direccion } = req.body

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Si se está actualizando el RUT, validarlo
    if (rut && rut !== existingCliente.rut) {
      if (!validarRut(rut)) {
        return res.status(400).json({ error: 'RUT inválido' })
      }

      // Verificar que el nuevo RUT no exista
      const rutExists = await prisma.cliente.findUnique({
        where: { rut }
      })

      if (rutExists) {
        return res.status(400).json({ 
          error: 'El RUT ya está registrado' 
        })
      }
    }

    // Actualizar cliente
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        rut,
        email,
        telefono,
        direccion
      }
    })

    res.json({
      message: 'Cliente actualizado exitosamente',
      cliente
    })
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}

// Eliminar cliente
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        ordenesTrabajos: true
      }
    })

    if (!existingCliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Verificar si tiene equipos u órdenes asociadas
    if (existingCliente.equipos.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene equipos asociados' 
      })
    }

    if (existingCliente.ordenesTrabajos.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene órdenes de trabajo asociadas' 
      })
    }

    // Eliminar cliente
    await prisma.cliente.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    res.status(500).json({ error: 'Error al eliminar cliente' })
  }
}