// ============================================
// SEED DE DESARROLLO - MODELO INVENTARIO
// ============================================
// ⚠️ IMPORTANTE: Este archivo es SOLO para desarrollo local
// Los precios aquí son EJEMPLOS GENÉRICOS
// Los precios REALES se ingresan en producción a través de la UI
// ============================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Solo ejecutar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Modo producción detectado')
    console.log('❌ Este script NO debe ejecutarse en producción')
    console.log('💡 Los datos se gestionan a través de la UI en producción')
    return
  }

  console.log('🌱 Iniciando seed de desarrollo...')

  // ============================================
  // USUARIO DEMO (Solo desarrollo)
  // ============================================
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@development.local' },
    update: {},
    create: {
      email: 'demo@development.local',
      username: 'demo',
      password: await bcrypt.hash('Demo123!', 10),
      name: 'Usuario Demo',
      role: 'admin',
      isActive: true
    }
  })

  console.log('✅ Usuario demo creado:', demoUser.email)

  // ============================================
  // INVENTARIO CON PRECIOS GENÉRICOS
  // ============================================
  // ⚠️ Los precios aquí son EJEMPLOS para desarrollo
  // NO representan precios reales de la empresa

  const equipos = [
    // Aires Acondicionados Split
    {
      tipo: 'Split Muro',
      marca: 'Marca A',
      modelo: '9000 BTU',
      capacidad: '9000 BTU',
      capacidadBTU: '9000',
      metrosCuadrados: '15-20',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca A',
      modelo: '12000 BTU',
      capacidad: '12000 BTU',
      capacidadBTU: '12000',
      metrosCuadrados: '20-30',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca A',
      modelo: '18000 BTU',
      capacidad: '18000 BTU',
      capacidadBTU: '18000',
      metrosCuadrados: '30-45',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca A',
      modelo: '24000 BTU',
      capacidad: '24000 BTU',
      capacidadBTU: '24000',
      metrosCuadrados: '45-60',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca B',
      modelo: '9000 BTU',
      capacidad: '9000 BTU',
      capacidadBTU: '9000',
      metrosCuadrados: '15-20',
      tipoGas: 'R32'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca B',
      modelo: '12000 BTU',
      capacidad: '12000 BTU',
      capacidadBTU: '12000',
      metrosCuadrados: '20-30',
      tipoGas: 'R32'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca B',
      modelo: '18000 BTU',
      capacidad: '18000 BTU',
      capacidadBTU: '18000',
      metrosCuadrados: '30-45',
      tipoGas: 'R32'
    },
    {
      tipo: 'Split Muro',
      marca: 'Marca B',
      modelo: '24000 BTU',
      capacidad: '24000 BTU',
      capacidadBTU: '24000',
      metrosCuadrados: '45-60',
      tipoGas: 'R32'
    },

    // Aires Acondicionados Piso-Techo
    {
      tipo: 'Piso-Techo',
      marca: 'Marca A',
      modelo: '36000 BTU',
      capacidad: '36000 BTU',
      capacidadBTU: '36000',
      metrosCuadrados: '60-80',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Piso-Techo',
      marca: 'Marca A',
      modelo: '48000 BTU',
      capacidad: '48000 BTU',
      capacidadBTU: '48000',
      metrosCuadrados: '80-100',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Piso-Techo',
      marca: 'Marca A',
      modelo: '60000 BTU',
      capacidad: '60000 BTU',
      capacidadBTU: '60000',
      metrosCuadrados: '100-120',
      tipoGas: 'R410A'
    },

    // Aires Acondicionados Cassette
    {
      tipo: 'Cassette',
      marca: 'Marca A',
      modelo: '24000 BTU',
      capacidad: '24000 BTU',
      capacidadBTU: '24000',
      metrosCuadrados: '45-60',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Cassette',
      marca: 'Marca A',
      modelo: '36000 BTU',
      capacidad: '36000 BTU',
      capacidadBTU: '36000',
      metrosCuadrados: '60-80',
      tipoGas: 'R410A'
    },
    {
      tipo: 'Cassette',
      marca: 'Marca A',
      modelo: '48000 BTU',
      capacidad: '48000 BTU',
      capacidadBTU: '48000',
      metrosCuadrados: '80-100',
      tipoGas: 'R410A'
    },

    // Sistemas VRF
    {
      tipo: 'VRF',
      marca: 'Marca A',
      modelo: '8HP',
      capacidad: '8HP',
      capacidadBTU: '96000',
      metrosCuadrados: '150-200',
      tipoGas: 'R410A'
    },
    {
      tipo: 'VRF',
      marca: 'Marca A',
      modelo: '10HP',
      capacidad: '10HP',
      capacidadBTU: '120000',
      metrosCuadrados: '200-250',
      tipoGas: 'R410A'
    },
    {
      tipo: 'VRF',
      marca: 'Marca A',
      modelo: '12HP',
      capacidad: '12HP',
      capacidadBTU: '144000',
      metrosCuadrados: '250-300',
      tipoGas: 'R410A'
    }
  ]

  // Función para generar precios genéricos
  function calcularPreciosGenericos(tipo, capacidadBTU) {
    let precioBase = 100000 // Precio base genérico

    // Ajustar según tipo
    if (tipo === 'Split Muro') {
      precioBase = 100000
    } else if (tipo === 'Piso-Techo') {
      precioBase = 200000
    } else if (tipo === 'Cassette') {
      precioBase = 250000
    } else if (tipo === 'VRF') {
      precioBase = 1000000
    }

    // Ajustar según capacidad
    const btu = parseInt(capacidadBTU) || 9000
    const factorCapacidad = btu / 9000
    const precioEquipo = precioBase * factorCapacidad

    // Costos genéricos
    const precioNeto = Math.round(precioEquipo)
    const IVA = 0.19
    const precioConIVA = Math.round(precioNeto * (1 + IVA))
    
    // Materiales genéricos (20% del equipo)
    const precioMaterial = Math.round(precioNeto * 0.2)
    const valorLogistica = Math.round(precioMaterial * 0.1)
    const valorMaterial = Math.round(precioMaterial + valorLogistica)
    
    // Precio al cliente (margen genérico 40%)
    const precioClienteNeto = Math.round((precioNeto + valorMaterial) * 1.4)
    const precioClienteIVA = Math.round(precioClienteNeto * IVA)
    const precioCliente = precioClienteNeto + precioClienteIVA
    
    const valorEquipoMaterialIVA = precioConIVA + Math.round(valorMaterial * (1 + IVA))
    const gananciaDescontandoIVA = precioCliente - valorEquipoMaterialIVA
    const gananciaDescontandoTecnicos = Math.round(gananciaDescontandoIVA * 0.7) // 30% para técnicos

    return {
      precioNeto,
      precioConIVA,
      precioMaterial,
      valorLogistica,
      valorMaterial,
      precioCliente,
      precioClienteNeto,
      precioClienteIVA,
      valorEquipoMaterialIVA,
      gananciaDescontandoIVA,
      gananciaDescontandoTecnicos
    }
  }

  // Generar stock aleatorio
  function generarStock(tipo) {
    if (tipo === 'VRF') return Math.floor(Math.random() * 3) + 1
    if (tipo === 'Split Muro') return Math.floor(Math.random() * 15) + 5
    if (tipo === 'Piso-Techo') return Math.floor(Math.random() * 8) + 2
    if (tipo === 'Cassette') return Math.floor(Math.random() * 10) + 3
    return Math.floor(Math.random() * 10) + 2
  }

  console.log('📦 Creando inventario de desarrollo...')

  let itemCount = 0
  for (const equipo of equipos) {
    const precios = calcularPreciosGenericos(equipo.tipo, equipo.capacidadBTU)
    const stock = generarStock(equipo.tipo)

    await prisma.inventario.create({
      data: {
        tipo: equipo.tipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        capacidad: equipo.capacidad,
        capacidadBTU: equipo.capacidadBTU,
        numeroSerie: null,
        codigoModelo: `${equipo.marca.replace(' ', '')}-${equipo.capacidadBTU}`,
        caracteristicas: '⚠️ Datos de ejemplo para desarrollo',
        metrosCuadrados: equipo.metrosCuadrados,
        tipoGas: equipo.tipoGas,
        precioNeto: precios.precioNeto,
        precioConIVA: precios.precioConIVA,
        precioMaterial: precios.precioMaterial,
        valorLogistica: precios.valorLogistica,
        valorMaterial: precios.valorMaterial,
        precioCliente: precios.precioCliente,
        precioClienteNeto: precios.precioClienteNeto,
        precioClienteIVA: precios.precioClienteIVA,
        valorEquipoMaterialIVA: precios.valorEquipoMaterialIVA,
        gananciaDescontandoIVA: precios.gananciaDescontandoIVA,
        gananciaDescontandoTecnicos: precios.gananciaDescontandoTecnicos,
        stock: stock,
        estado: 'disponible'
      }
    })
    itemCount++
  }

  console.log(`✅ ${itemCount} equipos de inventario creados`)

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  const totalUsers = await prisma.user.count()
  const totalInventario = await prisma.inventario.count()

  console.log('\n📊 Resumen del seed:')
  console.log(`   👥 Usuarios: ${totalUsers}`)
  console.log(`   📦 Equipos: ${totalInventario}`)
  console.log('\n✅ Seed completado exitosamente')
  console.log('\n⚠️  IMPORTANTE:')
  console.log('   - Los precios aquí son EJEMPLOS genéricos')
  console.log('   - Actualizar con precios reales en producción')
  console.log('   - Este script NO debe ejecutarse en producción')
  console.log('\n💡 Credenciales de prueba:')
  console.log('   Email: demo@development.local')
  console.log('   Password: Demo123!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })