import prisma from '../utils/prisma.js'

// Obtener inventario público (para landing page - sin autenticación)
export const getInventarioPublic = async (req, res) => {
  try {
    const inventario = await prisma.inventario.findMany({
      where: {
        stock: { gt: 0 },
        estado: 'disponible'
      },
      select: {
        id: true,
        tipo: true,
        marca: true,
        modelo: true,
        capacidad: true,
        capacidadBTU: true,
        tipoGas: true,
        metrosCuadrados: true,
        precioCliente: true,
        precioClienteIVA: true,
        stock: true,
        estado: true,
        caracteristicas: true
      },
      orderBy: [
        {
          marca: 'asc'  // Primero por marca alfabéticamente
        },
        {
          capacidadBTU: 'asc'  // Luego por capacidad de menor a mayor
        }
      ]
    })

    res.json(inventario)
  } catch (error) {
    console.error('Error al obtener inventario público:', error)
    res.status(500).json({ error: 'Error al obtener catálogo' })
  }
}

// Obtener todo el inventario
export const getInventario = async (req, res) => {
  try {
    const inventario = await prisma.inventario.findMany({
      orderBy: [
        {
          marca: 'asc'  // Primero por marca alfabéticamente
        },
        {
          capacidadBTU: 'asc'  // Luego por capacidad de menor a mayor
        }
      ]
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
    const { 
      tipo, 
      marca, 
      modelo, 
      numeroSerie, 
      capacidad,
      capacidadBTU, 
      tipoGas, 
      precioCompra,
      precioCliente, 
      precioInstalacion,
      stock,
      stockMinimo,
      estado,
      ubicacion,
      proveedor,
      caracteristicas,
      metrosCuadrados
    } = req.body

    // Validar campos requeridos
    if (!tipo || !marca || !modelo || !tipoGas) {
      return res.status(400).json({ 
        error: 'Tipo, marca, modelo y tipo de gas son requeridos' 
      })
    }

    // Verificar que el número de serie no exista si se proporciona
    if (numeroSerie) {
      const existingItem = await prisma.inventario.findFirst({
        where: { 
          numeroSerie: numeroSerie,
          NOT: { numeroSerie: null }
        }
      })

      if (existingItem) {
        return res.status(400).json({ 
          error: 'El número de serie ya está registrado' 
        })
      }
    }

    // Calcular precios con IVA (19%)
    const precioNeto = parseFloat(precioCompra) || 0
    const precioConIVA = precioNeto * 1.19
    const precioClienteVal = parseFloat(precioCliente) || 0
    const precioClienteNeto = precioClienteVal / 1.19
    const precioClienteIVA = precioClienteVal

    // Crear item
    const item = await prisma.inventario.create({
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie: numeroSerie || null,
        capacidad: capacidad || null,
        capacidadBTU: capacidadBTU ? String(capacidadBTU) : null,
        tipoGas,
        metrosCuadrados: metrosCuadrados || null,
        caracteristicas: caracteristicas || null,
        
        // Precios
        precioNeto,
        precioConIVA,
        precioMaterial: precioNeto, // Para compatibilidad
        valorLogistica: 0,
        valorMaterial: precioNeto,
        precioCliente: precioClienteVal,
        precioClienteNeto,
        precioClienteIVA,
        valorEquipoMaterialIVA: precioConIVA,
        gananciaDescontandoIVA: precioClienteNeto - precioNeto,
        gananciaDescontandoTecnicos: precioClienteNeto - precioNeto,
        
        // Stock
        stock: stock ? parseInt(stock) : 0,
        
        // Estado
        estado: estado || 'disponible'
      }
    })

    res.status(201).json({
      message: 'Item agregado al inventario exitosamente',
      item
    })
  } catch (error) {
    console.error('Error al crear item:', error)
    res.status(500).json({ 
      error: 'Error al crear item',
      details: error.message 
    })
  }
}

// Actualizar item
export const updateInventario = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      tipo, 
      marca, 
      modelo, 
      numeroSerie, 
      capacidad,
      capacidadBTU, 
      tipoGas, 
      precioCompra,
      precioCliente, 
      precioInstalacion,
      stock,
      stockMinimo,
      estado,
      ubicacion,
      proveedor,
      caracteristicas,
      metrosCuadrados
    } = req.body

    const existingItem = await prisma.inventario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Item no encontrado' })
    }

    // Verificar número de serie si cambió
    if (numeroSerie && numeroSerie !== existingItem.numeroSerie) {
      const serieExists = await prisma.inventario.findFirst({
        where: { 
          numeroSerie,
          NOT: { 
            id: parseInt(id)
          }
        }
      })

      if (serieExists) {
        return res.status(400).json({ 
          error: 'El número de serie ya está registrado' 
        })
      }
    }

    // Calcular precios con IVA si cambiaron
    const precioNeto = precioCompra !== undefined ? parseFloat(precioCompra) : existingItem.precioNeto
    const precioConIVA = precioNeto * 1.19
    const precioClienteVal = precioCliente !== undefined ? parseFloat(precioCliente) : existingItem.precioCliente
    const precioClienteNeto = precioClienteVal / 1.19
    const precioClienteIVA = precioClienteVal

    // Preparar datos para actualizar
    const updateData = {
      tipo: tipo || existingItem.tipo,
      marca: marca || existingItem.marca,
      modelo: modelo || existingItem.modelo,
      numeroSerie: numeroSerie !== undefined ? (numeroSerie || null) : existingItem.numeroSerie,
      capacidad: capacidad !== undefined ? (capacidad || null) : existingItem.capacidad,
      capacidadBTU: capacidadBTU !== undefined ? (capacidadBTU ? String(capacidadBTU) : null) : (existingItem.capacidadBTU ? String(existingItem.capacidadBTU) : null),
      tipoGas: tipoGas || existingItem.tipoGas,
      metrosCuadrados: metrosCuadrados !== undefined ? (metrosCuadrados || null) : existingItem.metrosCuadrados,
      caracteristicas: caracteristicas !== undefined ? (caracteristicas || null) : existingItem.caracteristicas,
      
      // Precios
      precioNeto,
      precioConIVA,
      precioMaterial: precioNeto,
      valorMaterial: precioNeto,
      precioCliente: precioClienteVal,
      precioClienteNeto,
      precioClienteIVA,
      valorEquipoMaterialIVA: precioConIVA,
      gananciaDescontandoIVA: precioClienteNeto - precioNeto,
      gananciaDescontandoTecnicos: precioClienteNeto - precioNeto,
      
      // Stock
      stock: stock !== undefined ? parseInt(stock) : existingItem.stock,
      
      // Estado
      estado: estado || existingItem.estado
    }

    const item = await prisma.inventario.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    res.json({
      message: 'Item actualizado exitosamente',
      item
    })
  } catch (error) {
    console.error('Error al actualizar item:', error)
    res.status(500).json({ 
      error: 'Error al actualizar item',
      details: error.message 
    })
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
