import prisma from '../utils/prisma.js'
import { encryptSensitiveFields, decryptSensitiveFields } from '../utils/encryption.js'

// ============================================
// GET DIRECCIONES DEL CLIENTE
// ============================================
export const getDireccionesCliente = async (req, res) => {
  try {
    const { clienteId } = req.params

    const direcciones = await prisma.direccionCliente.findMany({
      where: { clienteId: parseInt(clienteId) },
      orderBy: [
        { esPrincipal: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const direccionesDescifradas = direcciones.map(dir => decryptSensitiveFields(dir))

    res.json(direccionesDescifradas)
  } catch (error) {
    console.error('Error al obtener direcciones:', error)
    res.status(500).json({ error: 'Error al obtener direcciones del cliente' })
  }
}

// ============================================
// CREATE DIRECCION CLIENTE
// ============================================
export const createDireccionCliente = async (req, res) => {
  try {
    const { clienteId } = req.params
    const { nombre, direccion, comuna, ciudad, region, esPrincipal } = req.body

    if (!nombre || !direccion) {
      return res.status(400).json({ error: 'Nombre y dirección son requeridos' })
    }

    // Si es principal, desmarcar las otras
    if (esPrincipal) {
      await prisma.direccionCliente.updateMany({
        where: { clienteId: parseInt(clienteId) },
        data: { esPrincipal: false }
      })
    }

    // Verificar si es la primera dirección (marcarla principal si lo es)
    const count = await prisma.direccionCliente.count({
      where: { clienteId: parseInt(clienteId) }
    })
    const makePrincipal = count === 0 ? true : esPrincipal || false

    const dataAEncriptar = {
      nombre,
      direccion, // Se encriptará mágicamente por encryptSensitiveFields
      comuna,
      ciudad,
      region,
      esPrincipal: makePrincipal,
      clienteId: parseInt(clienteId)
    }

    const dataEncriptada = encryptSensitiveFields(dataAEncriptar)

    const nuevaDireccion = await prisma.direccionCliente.create({
      data: dataEncriptada
    })

    res.status(201).json(decryptSensitiveFields(nuevaDireccion))
  } catch (error) {
    console.error('Error al crear dirección:', error)
    res.status(500).json({ error: 'Error al crear la dirección' })
  }
}

// ============================================
// UPDATE DIRECCION CLIENTE
// ============================================
export const updateDireccionCliente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, direccion, comuna, ciudad, region, esPrincipal } = req.body

    // Si la marcan como principal, desmarcar las otras del mismo cliente
    if (esPrincipal) {
      const dirActual = await prisma.direccionCliente.findUnique({ where: { id: parseInt(id) } })
      if (dirActual) {
        await prisma.direccionCliente.updateMany({
          where: { clienteId: dirActual.clienteId, id: { not: parseInt(id) } },
          data: { esPrincipal: false }
        })
      }
    }

    const updates = { nombre, comuna, ciudad, region, esPrincipal }
    if (direccion) {
      updates.direccion = direccion // Trigger de cifrado
    }

    const dataEncriptada = encryptSensitiveFields(updates)

    const dirActualizada = await prisma.direccionCliente.update({
      where: { id: parseInt(id) },
      data: dataEncriptada
    })

    res.json(decryptSensitiveFields(dirActualizada))
  } catch (error) {
    console.error('Error al actualizar dirección:', error)
    res.status(500).json({ error: 'Error al actualizar la dirección' })
  }
}

// ============================================
// DELETE DIRECCION CLIENTE
// ============================================
export const deleteDireccionCliente = async (req, res) => {
  try {
    const { id } = req.params

    const dirToDelete = await prisma.direccionCliente.findUnique({ where: { id: parseInt(id) } })
    if (!dirToDelete) return res.status(404).json({ error: 'Dirección no encontrada' })

    await prisma.direccionCliente.delete({
      where: { id: parseInt(id) }
    })

    // Asegurar que si borró la principal quede alguna como principal
    if (dirToDelete.esPrincipal) {
      const otraReciente = await prisma.direccionCliente.findFirst({
        where: { clienteId: dirToDelete.clienteId },
        orderBy: { createdAt: 'desc' }
      })

      if (otraReciente) {
        await prisma.direccionCliente.update({
          where: { id: otraReciente.id },
          data: { esPrincipal: true }
        })
      }
    }

    res.json({ message: 'Dirección eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar dirección:', error)
    res.status(500).json({ error: 'Error al eliminar la dirección' })
  }
}
