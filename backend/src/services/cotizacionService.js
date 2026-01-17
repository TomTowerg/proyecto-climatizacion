import { PrismaClient } from '@prisma/client'
import { verificarStock, reducirStock } from './stockService.js'

const prisma = new PrismaClient()

/**
 * SERVICIO DE GESTIÓN DE COTIZACIONES
 * Maneja el flujo completo de aprobación de cotizaciones
 */

/**
 * APROBAR COTIZACIÓN
 * Flujo automático: Cotización → Cliente → Equipo → Orden de Trabajo → Update Stock
 */
export const aprobarCotizacion = async (cotizacionId, usuarioId) => {
  try {
    console.log(`\n🔄 Iniciando aprobación de cotización #${cotizacionId}`)

    // 1. VERIFICAR QUE LA COTIZACIÓN EXISTE
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        cliente: true,
        inventario: true,
        equipos: true,      // ⭐ INCLUIR EQUIPOS MÚLTIPLES
        materiales: true    // ⭐ INCLUIR MATERIALES
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
      const resultado = await procesarInstalacion(cotizacion, cliente)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo
      equiposCreados = resultado.equiposCreados || 1

    } else if (cotizacion.tipo === 'mantencion') {
      // FLUJO MANTENCIÓN
      const resultado = await procesarMantencion(cotizacion, cliente)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo

    } else if (cotizacion.tipo === 'reparacion') {
      // FLUJO REPARACIÓN
      const resultado = await procesarReparacion(cotizacion, cliente)
      equipo = resultado.equipo
      ordenTrabajo = resultado.ordenTrabajo
    }

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
        equipoCreado: true,
        ordenCreada: true,
        equipos: true,
        materiales: true
      }
    })

    console.log(`\n✅ COTIZACIÓN APROBADA EXITOSAMENTE`)
    console.log(`   Cliente: ${cliente.nombre}`)
    console.log(`   Equipos creados: ${equiposCreados}`)
    console.log(`   Orden de Trabajo: #${ordenTrabajo?.id || 'N/A'}`)

    return {
      success: true,
      cotizacion: cotizacionAprobada,
      equipo,
      ordenTrabajo,
      equiposCreados,
      mensaje: 'Cotización aprobada exitosamente'
    }

  } catch (error) {
    console.error('❌ Error al aprobar cotización:', error)
    throw error
  }
}

/**
 * VALIDAR COTIZACIÓN POR TIPO
 */
const validarCotizacionPorTipo = async (cotizacion) => {
  try {
    if (cotizacion.tipo === 'instalacion') {
      // ⭐ VALIDAR SISTEMA NUEVO (MÚLTIPLES EQUIPOS)
      if (cotizacion.equipos && cotizacion.equipos.length > 0) {
        console.log(`📦 Validando ${cotizacion.equipos.length} equipos...`)
        
        for (const equipoCot of cotizacion.equipos) {
          const stockCheck = await verificarStock(equipoCot.inventarioId, equipoCot.cantidad)
          if (!stockCheck.disponible) {
            return { valido: false, error: stockCheck.error }
          }
        }
        
        return { valido: true }
      }
      
      // VALIDAR SISTEMA ANTIGUO (UN EQUIPO)
      if (!cotizacion.inventarioId) {
        return { valido: false, error: 'Se requiere un producto del inventario para instalación' }
      }

      const stockCheck = await verificarStock(cotizacion.inventarioId, 1)
      if (!stockCheck.disponible) {
        return { valido: false, error: stockCheck.error }
      }

      return { valido: true }

    } else if (cotizacion.tipo === 'mantencion' || cotizacion.tipo === 'reparacion') {
      // Para mantención/reparación: Verificar que existe equipo del cliente
      const equiposCliente = await prisma.equipo.findMany({
        where: { clienteId: cotizacion.clienteId }
      })

      if (equiposCliente.length === 0) {
        return { 
          valido: false, 
          error: 'El cliente no tiene equipos registrados. Para mantención/reparación se requiere un equipo existente.' 
        }
      }

      return { valido: true }

    } else {
      return { valido: false, error: 'Tipo de servicio no válido' }
    }
  } catch (error) {
    console.error('Error en validación:', error)
    return { valido: false, error: error.message }
  }
}

/**
 * ⭐ PROCESAR INSTALACIÓN CON MÚLTIPLES EQUIPOS
 * 1. Verificar stock y reducir inventario
 * 2. Crear equipos del cliente (uno o múltiples)
 * 3. Crear orden de trabajo
 */
const procesarInstalacion = async (cotizacion, cliente) => {
  try {
    console.log(`\n🔧 Procesando instalación...`)

    const equiposCreados = []
    let totalEquipos = 0

    // ⭐ VERIFICAR SI HAY MÚLTIPLES EQUIPOS
    const equiposCotizacion = await prisma.equipoCotizacion.findMany({
      where: { cotizacionId: cotizacion.id },
      include: { inventario: true }
    })

    if (equiposCotizacion && equiposCotizacion.length > 0) {
      // ========================================
      // FLUJO MÚLTIPLES EQUIPOS
      // ========================================
      console.log(`🛒 Procesando ${equiposCotizacion.length} equipos...`)

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

    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'instalacion',
        estado: 'pendiente',
        fecha: calcularFechaInstalacion(),
        clienteId: cliente.id,
        equipoId: equipoPrincipal.id,
        cotizacionId: cotizacion.id,
        tecnico: 'Por asignar',
        notas: `Instalación de ${descripcionEquipos}. Dirección: ${cotizacion.direccionInstalacion || cliente.direccion || 'No especificada'}`
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
const procesarMantencion = async (cotizacion, cliente) => {
  try {
    console.log(`\n🔧 Procesando mantención...`)

    // 1. Buscar equipo del cliente (usar el más antiguo)
    const equipo = await prisma.equipo.findFirst({
      where: { clienteId: cliente.id, estado: 'activo' },
      orderBy: { fechaInstalacion: 'asc' }
    })

    if (!equipo) {
      throw new Error('No se encontró equipo activo para mantención')
    }

    console.log(`✅ Equipo para mantención: ${equipo.marca} ${equipo.modelo}`)

    // 2. Crear orden de trabajo de mantención
    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'mantencion',
        estado: 'pendiente',
        fecha: calcularFechaInstalacion(), // Próximo día disponible
        clienteId: cliente.id,
        equipoId: equipo.id,
        cotizacionId: cotizacion.id,
        tecnico: 'Por asignar',
        notas: `Mantención preventiva de ${equipo.marca} ${equipo.modelo}`
      }
    })

    // 3. Actualizar equipo
    await prisma.equipo.update({
      where: { id: equipo.id },
      data: {
        estado: 'en_mantenimiento',
        cotizacionId: cotizacion.id
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
const procesarReparacion = async (cotizacion, cliente) => {
  try {
    console.log(`\n🔨 Procesando reparación...`)

    // 1. Buscar equipo del cliente
    const equipo = await prisma.equipo.findFirst({
      where: { clienteId: cliente.id, estado: { in: ['activo', 'en_mantenimiento'] } },
      orderBy: { fechaInstalacion: 'desc' }
    })

    if (!equipo) {
      throw new Error('No se encontró equipo para reparación')
    }

    console.log(`✅ Equipo para reparación: ${equipo.marca} ${equipo.modelo}`)

    // 2. Crear orden de trabajo de reparación
    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data: {
        tipo: 'reparacion',
        estado: 'pendiente',
        fecha: calcularFechaInstalacion(),
        clienteId: cliente.id,
        equipoId: equipo.id,
        cotizacionId: cotizacion.id,
        tecnico: 'Por asignar',
        costoMateriales: cotizacion.costoMaterial || 0,
        notas: `Reparación de ${equipo.marca} ${equipo.modelo}`
      }
    })

    // 3. Actualizar equipo
    await prisma.equipo.update({
      where: { id: equipo.id },
      data: {
        estado: 'en_mantenimiento',
        cotizacionId: cotizacion.id
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