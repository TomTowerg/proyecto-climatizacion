import { PrismaClient } from '@prisma/client'
import { verificarStock, reducirStock } from './stockService.js'

const prisma = new PrismaClient()

/**
 * SERVICIO DE GESTIÓN DE COTIZACIONES - VERSIÓN CORREGIDA
 * Maneja el flujo completo de aprobación de cotizaciones
 * Sin equipoCreado/ordenCreada + Verificación de orden existente
 */

/**
 * APROBAR COTIZACIÓN
 * Flujo automático: Cotización → Cliente → Equipo → Orden de Trabajo → Update Stock
 */
export const aprobarCotizacion = async (cotizacionId, usuarioId, payload = {}) => {
  try {
    console.log(`\n🔄 Iniciando aprobación de cotización #${cotizacionId}`)

    // 1. VERIFICAR QUE LA COTIZACIÓN EXISTE
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        cliente: true,
        inventario: true,
        equipos: true,      // ⭐ INCLUIR EQUIPOS MÚLTIPLES
        materiales: true,
        equiposCliente: true,  // ⭐ EQUIPOS SELECCIONADOS PARA MANTENCION
        instalaciones: true,
        mantenciones: true
      }
    })

    if (!cotizacion) {
      throw new Error('Cotización no encontrada')
    }

    if (cotizacion.estado === 'aprobada') {
      throw new Error('La cotización ya fue aprobada anteriormente')
    }

    if (cotizacion.estado === 'eliminada') {
      throw new Error('No se puede aprobar una cotización eliminada')
    }

    console.log(`✅ Cotización encontrada: ${cotizacion.tipo}`)

    // ⭐ VERIFICAR SI YA EXISTE ORDEN DE TRABAJO PARA ESTA COTIZACIÓN
    const ordenExistente = await prisma.ordenTrabajo.findFirst({
      where: { cotizacionId: cotizacionId }
    })

    if (ordenExistente) {
      console.log(`⚠️  Ya existe orden de trabajo #${ordenExistente.id} para esta cotización`)
      throw new Error(`Esta cotización ya tiene una orden de trabajo asociada (#${ordenExistente.id})`)
    }

    // 2. VALIDAR SEGÚN TIPO DE SERVICIO
    const validacion = await validarCotizacionPorTipo(cotizacion)
    if (!validacion.valido) {
      throw new Error(validacion.error)
    }

    // 3. CREAR O VERIFICAR CLIENTE
    let cliente = cotizacion.cliente
    if (!cliente) {
      throw new Error('La cotización debe tener un cliente asociado')
    }
    console.log(`✅ Cliente: ${cliente.nombre}`)

    // 4. PROCESAR SEGÚN TIPO DE SERVICIO
    let equipo = null
    let ordenTrabajo = null
    let equiposCreados = 0

    if (cotizacion.tipo === 'instalacion') {
      // FLUJO INSTALACIÓN
      const resultado = await procesarInstalacion(cotizacion, cliente, payload)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo
      equiposCreados = resultado.equiposCreados || 1

    } else if (cotizacion.tipo === 'mantencion') {
      // FLUJO MANTENCIÓN
      const resultado = await procesarMantencion(cotizacion, cliente, payload)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo

    } else if (cotizacion.tipo === 'reparacion') {
      // FLUJO REPARACIÓN
      const resultado = await procesarReparacion(cotizacion, cliente, payload)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo
    } else if (cotizacion.tipo === 'visita_tecnica') {
      const resultado = await procesarMantencion(cotizacion, cliente, payload)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo
    }

  // ⭐ REDUCIR STOCK DE MATERIALES
  console.log('📦 Reduciendo stock de materiales...')

  for (const materialCot of cotizacion.materiales) {
    // Si el material tiene relación con inventario, reducir stock
    if (materialCot.materialInventarioId) {
      const materialInventario = await prisma.materialInventario.findUnique({
        where: { id: materialCot.materialInventarioId }
      })

      if (materialInventario) {
        const nuevoStock = materialInventario.stock - materialCot.cantidad

        if (nuevoStock < 0) {
          console.log(`⚠️  Advertencia: Stock insuficiente para ${materialInventario.nombre}`)
          console.log(`   Stock actual: ${materialInventario.stock}, Solicitado: ${materialCot.cantidad}`)
          // Continuar de todas formas, pero registrar advertencia
        }

        await prisma.materialInventario.update({
          where: { id: materialInventario.id },
          data: { stock: Math.max(0, nuevoStock) } // No permitir stock negativo
        })

        console.log(`📦 Stock reducido: ${materialInventario.nombre}`)
        console.log(`   ${materialInventario.stock} → ${Math.max(0, nuevoStock)} ${materialInventario.unidad}`)
      }
    }
  }

  console.log('✅ Stock de materiales actualizado')

    // 5. ACTUALIZAR COTIZACIÓN COMO APROBADA
    const cotizacionAprobada = await prisma.cotizacion.update({
      where: { id: cotizacionId },
      data: {
        estado: 'aprobada',
        fechaAprobacion: new Date()
      },
      include: {
        cliente: true,
        inventario: true,
        equipos: true,
        materiales: true
      }
    })

    console.log(`\n✅ COTIZACIÓN APROBADA EXITOSAMENTE`)
    console.log(`   Cliente: ${cliente.nombre}`)
    console.log(`   Equipos creados: ${equiposCreados}`)
    console.log(`   Orden de trabajo: #${ordenTrabajo?.id}`)

    return {
      success: true,
      cotizacion: cotizacionAprobada,
      equipo,
      ordenTrabajo,
      equiposCreados,
      mensaje: `Cotización aprobada. Se crearon ${equiposCreados} equipo(s) y orden de trabajo #${ordenTrabajo?.id}`
    }

  } catch (error) {
    console.error(`❌ Error al aprobar cotización:`, error)
    throw error
  }
}

/**
 * VALIDAR COTIZACIÓN POR TIPO
 */
const validarCotizacionPorTipo = async (cotizacion) => {
  if (cotizacion.tipo === 'instalacion') {
    // Validar que tenga equipos O inventario
    if (!cotizacion.equipos || (cotizacion.equipos.length === 0 && !cotizacion.inventarioId)) {
      return {
        valido: false,
        error: 'La cotización de instalación debe tener al menos un equipo asociado'
      }
    }

    // Validar stock de equipos múltiples
    if (cotizacion.equipos && cotizacion.equipos.length > 0) {
      for (const equipoCot of cotizacion.equipos) {
        const producto = await prisma.inventario.findUnique({
          where: { id: equipoCot.inventarioId }
        })

        if (!producto) {
          return {
            valido: false,
            error: `Producto con ID ${equipoCot.inventarioId} no encontrado`
          }
        }

        if (producto.stock < equipoCot.cantidad) {
          return {
            valido: false,
            error: `Stock insuficiente para ${producto.marca} ${producto.modelo}. Disponible: ${producto.stock}, Solicitado: ${equipoCot.cantidad}`
          }
        }
      }
    }

  } else if (cotizacion.tipo === 'mantencion' || cotizacion.tipo === 'reparacion' || cotizacion.tipo === 'visita_tecnica') {
    // Validar que el cliente tenga equipos
    const equiposCliente = await prisma.equipo.count({
      where: { clienteId: cotizacion.clienteId, estado: 'activo' }
    })

    if (equiposCliente === 0) {
      return {
        valido: false,
        error: `El cliente no tiene equipos activos para ${cotizacion.tipo}`
      }
    }
  }

  return { valido: true }
}

/**
 * PROCESAR INSTALACIÓN
 * 1. Verificar stock
 * 2. Crear equipos para el cliente
 * 3. Reducir stock del inventario
 * 4. Crear orden de trabajo
 */
const procesarInstalacion = async (cotizacion, cliente, payload = {}) => {
  try {
    console.log(`\n🔧 Procesando instalación...`)

    const equiposCreados = []
    let totalEquipos = 0

    // ========================================
    // FLUJO NUEVO - MÚLTIPLES EQUIPOS
    // ========================================
    if (cotizacion.equipos && cotizacion.equipos.length > 0) {
      console.log(`🛒 Procesando ${cotizacion.equipos.length} equipos...`)

      // Primero obtener todos los productos con sus datos de inventario
      const equiposCotizacion = await Promise.all(
        cotizacion.equipos.map(async (eq) => {
          const inventario = await prisma.inventario.findUnique({
            where: { id: eq.inventarioId }
          })
          return { ...eq, inventario }
        })
      )

      console.log(`📦 Validando ${equiposCotizacion.length} equipos...`)

      // Crear todos los equipos
      for (const equipoCot of equiposCotizacion) {
        const producto = equipoCot.inventario
        const cantidad = equipoCot.cantidad

        // Verificar stock
        if (producto.stock < cantidad) {
          throw new Error(
            `Stock insuficiente para ${producto.marca} ${producto.modelo}. ` +
            `Disponible: ${producto.stock}, Solicitado: ${cantidad}`
          )
        }

        // Crear equipos (uno por cada cantidad)
        for (let i = 0; i < cantidad; i++) {
          const numeroEquipo = totalEquipos + i + 1
          
          const equipo = await prisma.equipo.create({
            data: {
              tipo: producto.tipo,
              marca: producto.marca,
              modelo: producto.modelo,
              numeroSerie: `${producto.marca}-${producto.modelo}-${producto.capacidadBTU}BTU-${Date.now()}-${numeroEquipo}`,
              capacidad: `${producto.capacidadBTU} BTU`,
              tipoGas: producto.tipoGas,
              estado: 'activo',
              fechaInstalacion: new Date(),
              fechaCompra: new Date(),
              clienteId: cliente.id,
              inventarioId: producto.id,
              cotizacionId: cotizacion.id
            }
          })

          equiposCreados.push(equipo)
          console.log(`   ✅ Equipo ${numeroEquipo}: ${equipo.marca} ${equipo.modelo}`)
        }

        // Reducir stock
        await prisma.inventario.update({
          where: { id: producto.id },
          data: { stock: { decrement: cantidad } }
        })

        console.log(`   📦 Stock reducido: ${producto.marca} ${producto.modelo} (-${cantidad})`)
        totalEquipos += cantidad
      }

    } else if (cotizacion.inventarioId) {
      // ========================================
      // FLUJO ANTIGUO - UN SOLO EQUIPO
      // ========================================
      console.log(`📦 Procesando equipo único (sistema antiguo)...`)

      const producto = await prisma.inventario.findUnique({
        where: { id: cotizacion.inventarioId }
      })

      if (!producto) {
        throw new Error('Producto no encontrado en inventario')
      }

      if (producto.stock === 0) {
        throw new Error('Producto sin stock disponible')
      }

      // Reducir stock
      await prisma.inventario.update({
        where: { id: producto.id },
        data: { stock: { decrement: 1 } }
      })

      // Crear equipo
      const equipo = await prisma.equipo.create({
        data: {
          tipo: producto.tipo,
          marca: producto.marca,
          modelo: producto.modelo,
          numeroSerie: `${producto.marca}-${producto.modelo}-${producto.capacidadBTU}BTU-${Date.now()}`,
          capacidad: `${producto.capacidadBTU} BTU`,
          tipoGas: producto.tipoGas,
          estado: 'activo',
          fechaInstalacion: new Date(),
          fechaCompra: new Date(),
          clienteId: cliente.id,
          inventarioId: producto.id,
          cotizacionId: cotizacion.id
        }
      })

      equiposCreados.push(equipo)
      console.log(`✅ Equipo creado: ${equipo.marca} ${equipo.modelo}`)
      totalEquipos = 1
    }

    if (equiposCreados.length === 0) {
      throw new Error('No se pudo crear ningún equipo')
    }

    // ⭐ CREAR ORDEN DE TRABAJO (usar el primer equipo como principal)
    const equipoPrincipal = equiposCreados[0]
    
    const descripcionEquipos = equiposCreados.length === 1
      ? `${equipoPrincipal.marca} ${equipoPrincipal.modelo} ${equipoPrincipal.capacidad}`
      : `${equiposCreados.length} equipos: ${equiposCreados.map(e => `${e.marca} ${e.modelo}`).join(', ')}`

    // ⭐ IMPORTANTE: cotizacionId ahora puede ser usado porque verificamos que no existe orden previa
    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'instalacion',
        estado: 'pendiente',
        fecha: payload.fechaInstalacion ? new Date(payload.fechaInstalacion) : calcularFechaInstalacion(),
        clienteId: cliente.id,
        equipoId: equipoPrincipal.id,
        cotizacionId: cotizacion.id,  // ⭐ SEGURO - Ya verificamos que no existe
        tecnico: 'Por asignar',
        notas: `Instalación de ${descripcionEquipos}. Dirección: ${cotizacion.direccionInstalacion || cliente.direccion || 'No especificada'}${payload.fechaInstalacion ? `\n> Fecha programada inicialmente: ${payload.fechaInstalacion}` : ''}`
      }
    })

    console.log(`✅ Orden de trabajo creada: #${ordenTrabajo.id}`)
    console.log(`   Total equipos instalados: ${equiposCreados.length}`)

    return { 
      equipo: equipoPrincipal, 
      ordenTrabajo,
      equiposCreados: equiposCreados.length
    }

  } catch (error) {
    console.error('Error en procesarInstalacion:', error)
    throw error
  }
}

/**
 * PROCESAR MANTENCIÓN
 * 1. Buscar equipo existente del cliente
 * 2. Crear orden de trabajo de mantención
 */
const procesarMantencion = async (cotizacion, cliente, payload = {}) => {
  try {
    console.log(`\n🔧 Procesando mantención...`)

    // 1. Determinar equipo(s) a mantener
    let equipo = null
    if (cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0) {
      equipo = cotizacion.equiposCliente[0]
    } else {
      equipo = await prisma.equipo.findFirst({
        where: { clienteId: cliente.id, estado: 'activo' },
        orderBy: { fechaInstalacion: 'asc' }
      })
    }

    if (!equipo) {
      throw new Error('No se encontró equipo activo para mantención')
    }

    console.log(`✅ Equipo para mantención: ${equipo.marca} ${equipo.modelo}`)

    // 2. Crear orden de trabajo de mantención
    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'mantencion',
        estado: 'pendiente',
        fecha: payload.fechaInstalacion ? new Date(payload.fechaInstalacion) : calcularFechaInstalacion(), // Próximo día disponible
        clienteId: cliente.id,
        equipoId: equipo.id,
        cotizacionId: cotizacion.id,  // ⭐ SEGURO - Ya verificamos que no existe
        tecnico: 'Por asignar',
        notas: `Mantención preventiva de ${equipo.marca} ${equipo.modelo}${payload.fechaInstalacion ? `\n> Fecha programada inicialmente: ${payload.fechaInstalacion}` : ''}`,
        equiposMantenimiento: cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0 ? {
          connect: cotizacion.equiposCliente.map(e => ({ id: e.id }))
        } : undefined
      }
    })

    // 3. Actualizar equipo
    await prisma.equipo.update({
      where: { id: equipo.id },
      data: {
        estado: 'en_mantenimiento'
      }
    })

    console.log(`✅ Orden de trabajo creada: #${ordenTrabajo.id}`)

    return { equipo, ordenTrabajo }

  } catch (error) {
    console.error('Error en procesarMantencion:', error)
    throw error
  }
}

/**
 * PROCESAR REPARACIÓN
 * Similar a mantención pero con posibilidad de reemplazo de equipo
 */
const procesarReparacion = async (cotizacion, cliente, payload = {}) => {
  try {
    console.log(`\n🔨 Procesando reparación...`)

    // 1. Buscar equipo del cliente
    let equipo = null
    if (cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0) {
      equipo = cotizacion.equiposCliente[0]
    } else {
      equipo = await prisma.equipo.findFirst({
        where: { clienteId: cliente.id, estado: { in: ['activo', 'en_mantenimiento'] } },
        orderBy: { fechaInstalacion: 'desc' }
      })
    }

    if (!equipo) {
      throw new Error('No se encontró equipo para reparación')
    }

    console.log(`✅ Equipo para reparación: ${equipo.marca} ${equipo.modelo}`)

    // 2. Crear orden de trabajo de reparación
    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'reparacion',
        estado: 'pendiente',
        fecha: payload.fechaInstalacion ? new Date(payload.fechaInstalacion) : calcularFechaInstalacion(),
        clienteId: cliente.id,
        equipoId: equipo.id,
        cotizacionId: cotizacion.id,  // ⭐ SEGURO - Ya verificamos que no existe
        tecnico: 'Por asignar',
        costoMateriales: cotizacion.costoMaterial || 0,
        notas: `Reparación de ${equipo.marca} ${equipo.modelo}${payload.fechaInstalacion ? `\n> Fecha programada inicialmente: ${payload.fechaInstalacion}` : ''}`,
        equiposMantenimiento: cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0 ? {
          connect: cotizacion.equiposCliente.map(e => ({ id: e.id }))
        } : undefined
      }
    })

    // 3. Actualizar equipo
    await prisma.equipo.update({
      where: { id: equipo.id },
      data: {
        estado: 'en_mantenimiento'
      }
    })

    console.log(`✅ Orden de trabajo creada: #${ordenTrabajo.id}`)

    return { equipo, ordenTrabajo }

  } catch (error) {
    console.error('Error en procesarReparacion:', error)
    throw error
  }
}

/**
 * CALCULAR FECHA DE INSTALACIÓN
 * Devuelve el próximo día hábil disponible
 */
const calcularFechaInstalacion = () => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 2) // 2 días después como mínimo
  
  // Si cae en fin de semana, mover al lunes
  const diaSemana = fecha.getDay()
  if (diaSemana === 0) { // Domingo
    fecha.setDate(fecha.getDate() + 1)
  } else if (diaSemana === 6) { // Sábado
    fecha.setDate(fecha.getDate() + 2)
  }
  
  return fecha
}

/**
 * RECHAZAR COTIZACIÓN
 */
export const rechazarCotizacion = async (cotizacionId, motivo = null) => {
  try {
    const cotizacion = await prisma.cotizacion.update({
      where: { id: cotizacionId },
      data: {
        estado: 'eliminada',
        observaciones: motivo ? `Rechazada: ${motivo}` : 'Rechazada por el cliente'
      }
    })

    console.log(`✅ Cotización #${cotizacionId} rechazada`)

    return {
      success: true,
      cotizacion,
      mensaje: 'Cotización rechazada'
    }
  } catch (error) {
    console.error('Error al rechazar cotización:', error)
    throw error
  }
}

/**
 * OBTENER ESTADÍSTICAS DE COTIZACIONES
 */
export const obtenerEstadisticasCotizaciones = async () => {
  try {
    const total = await prisma.cotizacion.count()
    const pendientes = await prisma.cotizacion.count({ where: { estado: 'pendiente' } })
    const aprobadas = await prisma.cotizacion.count({ where: { estado: 'aprobada' } })
    const rechazadas = await prisma.cotizacion.count({ where: { estado: 'eliminada' } })

    const valorTotalAprobadas = await prisma.cotizacion.aggregate({
      _sum: { precioFinal: true },
      where: { estado: 'aprobada' }
    })

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas,
      tasaAprobacion: total > 0 ? ((aprobadas / total) * 100).toFixed(2) : 0,
      valorTotalAprobadas: valorTotalAprobadas._sum.precioFinal || 0
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    throw error
  }
}

export default {
  aprobarCotizacion,
  rechazarCotizacion,
  obtenerEstadisticasCotizaciones
}