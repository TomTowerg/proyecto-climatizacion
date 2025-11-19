// ============================================
// CLIENTES CONTROLLER CON CIFRADO
// backend/src/controllers/clienteController.js
// ============================================

import prisma from '../utils/prisma.js'
import { 
  encryptSensitiveFields, 
  decryptSensitiveFields,
  hash 
} from '../utils/encryption.js'

// ============================================
// GET ALL CLIENTES
// ============================================
export const getClientes = async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        equipos: true,
        _count: {
          select: {
            equipos: true,
            ordenesTrabajos: true,
            cotizaciones: true
          }
        }
      }
    })

    // Descifrar datos sensibles de cada cliente
    const clientesDescifrados = clientes.map(cliente => 
      decryptSensitiveFields(cliente)
    )

    res.json(clientesDescifrados)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    res.status(500).json({ 
      error: 'Error al obtener clientes',
      details: error.message 
    })
  }
}

// ============================================
// GET CLIENTE BY ID
// ============================================
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
      include: {
        equipos: true,
        ordenesTrabajos: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        cotizaciones: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Descifrar datos sensibles
    const clienteDescifrado = decryptSensitiveFields(cliente)

    res.json(clienteDescifrado)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    res.status(500).json({ 
      error: 'Error al obtener cliente',
      details: error.message 
    })
  }
}

// ============================================
// CREATE CLIENTE
// ============================================
export const createCliente = async (req, res) => {
  try {
    const datosCliente = req.body

    // Validar campos requeridos
    if (!datosCliente.nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    // Cifrar datos sensibles
    const datosEncriptados = encryptSensitiveFields(datosCliente)

    const cliente = await prisma.cliente.create({
      data: datosEncriptados
    })

    // Descifrar para respuesta
    const clienteDescifrado = decryptSensitiveFields(cliente)

    res.status(201).json(clienteDescifrado)
  } catch (error) {
    console.error('Error al crear cliente:', error)
    
    // Error de RUT duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('rut_hash')) {
      return res.status(400).json({ 
        error: 'Ya existe un cliente con ese RUT' 
      })
    }

    // Error de email duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('email_hash')) {
      return res.status(400).json({ 
        error: 'Ya existe un cliente con ese email' 
      })
    }

    res.status(500).json({ 
      error: 'Error al crear cliente',
      details: error.message 
    })
  }
}

// ============================================
// UPDATE CLIENTE
// ============================================
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params
    const datosActualizacion = req.body

    // Verificar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) }
    })

    if (!clienteExistente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Cifrar datos sensibles si fueron modificados
    const datosEncriptados = encryptSensitiveFields(datosActualizacion)

    const clienteActualizado = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: datosEncriptados
    })

    // Descifrar para respuesta
    const clienteDescifrado = decryptSensitiveFields(clienteActualizado)

    res.json(clienteDescifrado)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    
    // Error de RUT duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('rut_hash')) {
      return res.status(400).json({ 
        error: 'Ya existe otro cliente con ese RUT' 
      })
    }

    res.status(500).json({ 
      error: 'Error al actualizar cliente',
      details: error.message 
    })
  }
}

// ============================================
// DELETE CLIENTE
// ============================================
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params

    // Verificar si tiene equipos asociados
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

    if (cliente.equipos.length > 0 || cliente.ordenesTrabajos.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene equipos u órdenes de trabajo asociadas' 
      })
    }

    await prisma.cliente.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    res.status(500).json({ 
      error: 'Error al eliminar cliente',
      details: error.message 
    })
  }
}

// ============================================
// SEARCH CLIENTES (General)
// ============================================
export const searchClientes = async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.json([])
    }

    // Buscar solo por nombre (datos no cifrados)
    const clientes = await prisma.cliente.findMany({
      where: {
        nombre: {
          contains: q,
          mode: 'insensitive'
        }
      },
      take: 10,
      include: {
        _count: {
          select: {
            equipos: true,
            ordenesTrabajos: true
          }
        }
      }
    })

    // Descifrar datos sensibles
    const clientesDescifrados = clientes.map(cliente => 
      decryptSensitiveFields(cliente)
    )

    res.json(clientesDescifrados)
  } catch (error) {
    console.error('Error al buscar clientes:', error)
    res.status(500).json({ 
      error: 'Error al buscar clientes',
      details: error.message 
    })
  }
}

// ============================================
// SEARCH BY RUT
// ============================================
export const getClienteByRut = async (req, res) => {
  try {
    const { rut } = req.params

    // Generar hash del RUT para buscar (sin descifrar toda la BD)
    const rutHash = hash(rut)

    const cliente = await prisma.cliente.findFirst({
      where: { rut_hash: rutHash },
      include: {
        equipos: true,
        ordenesTrabajos: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    // Descifrar datos sensibles
    const clienteDescifrado = decryptSensitiveFields(cliente)

    res.json(clienteDescifrado)
  } catch (error) {
    console.error('Error al buscar cliente:', error)
    res.status(500).json({ 
      error: 'Error al buscar cliente',
      details: error.message 
    })
  }
}