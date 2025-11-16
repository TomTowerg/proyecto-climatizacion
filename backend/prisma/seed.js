import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// USUARIOS ADMINISTRADOR
const ADMIN_USERS = [
  {
    email: 'admin@climatizacion.com',
    password: 'Admin123!',
    name: 'Administrador Principal',
    username: 'admin',
    role: 'admin'
  },
  {
    email: 'niveksar@gmail.com',
    password: 'Nivek123!',
    name: 'Kevin Torres',
    username: 'niveksar',
    role: 'admin'
  },
  {
    email: 'torres.tomas35@gmail.com',
    password: 'Tomas123!',
    name: 'Tomas Torres',
    username: 'tomastorres',
    role: 'admin'
  }
]

// DATOS DEL INVENTARIO (basados en imágenes Excel)
const INVENTARIO_DATA = [
  // HISENSE - SPLIT MURO INV. VIDA Wi-Fi
  {
    tipo: 'Split Muro',
    marca: 'Hisense',
    modelo: 'SPLIT MURO INV. VIDA Wi-Fi',
    capacidadBTU: 9000,
    metrosCuadrados: '16-20',
    tipoGas: 'R32',
    precioNeto: 190000,
    precioConIVA: 247000,
    precioMaterial: 267000,
    valorLogistica: 20900,
    valorMaterial: 20000,
    precioCliente: 408800,
    precioClienteNeto: 332608,
    precioClienteIVA: 72088,
    valorEquipoMaterialIVA: 267000,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 5,
    caracteristicas: 'WiFi, Inverter, Vida',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Hisense',
    modelo: 'SPLIT MURO INV. VIDA Wi-Fi',
    capacidadBTU: 12000,
    metrosCuadrados: '24-30',
    tipoGas: 'R32',
    precioNeto: 225000,
    precioConIVA: 292500,
    precioMaterial: 312500,
    valorLogistica: 24750,
    valorMaterial: 20000,
    precioCliente: 455300,
    precioClienteNeto: 383025,
    precioClienteIVA: 166975,
    valorEquipoMaterialIVA: 312500,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 3,
    caracteristicas: 'WiFi, Inverter, Vida',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Hisense',
    modelo: 'SPLIT MURO INV. VIDA Wi-Fi',
    capacidadBTU: 18000,
    metrosCuadrados: '32-40',
    tipoGas: 'R32',
    precioNeto: 355000,
    precioConIVA: 461500,
    precioMaterial: 491500,
    valorLogistica: 39050,
    valorMaterial: 30000,
    precioCliente: 670000,
    precioClienteNeto: 579412,
    precioClienteIVA: 110088,
    valorEquipoMaterialIVA: 491500,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter, Vida',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Hisense',
    modelo: 'SPLIT MURO INV. VIDA Wi-Fi',
    capacidadBTU: 22000,
    metrosCuadrados: '45-50',
    tipoGas: 'R32',
    precioNeto: 370000,
    precioConIVA: 481000,
    precioMaterial: 511000,
    valorLogistica: 40700,
    valorMaterial: 30000,
    precioCliente: 689500,
    precioClienteNeto: 579412,
    precioClienteIVA: 110088,
    valorEquipoMaterialIVA: 511000,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter, Vida',
    estado: 'disponible'
  },

  // KENDAL - SPLIT MURO INV. Wi-Fi
  {
    tipo: 'Split Muro',
    marca: 'Kendal',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 9000,
    metrosCuadrados: '16-18',
    tipoGas: 'R32',
    precioNeto: 215000,
    precioConIVA: 279500,
    precioMaterial: 299500,
    valorLogistica: 23650,
    valorMaterial: 20000,
    precioCliente: 442300,
    precioClienteNeto: 354202,
    precioClienteIVA: 67268,
    valorEquipoMaterialIVA: 299500,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 4,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Kendal',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 12000,
    metrosCuadrados: '24-30',
    tipoGas: 'R32',
    precioNeto: 220000,
    precioConIVA: 286000,
    precioMaterial: 306000,
    valorLogistica: 24200,
    valorMaterial: 20000,
    precioCliente: 448800,
    precioClienteNeto: 377143,
    precioClienteIVA: 71657,
    valorEquipoMaterialIVA: 306000,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 3,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Kendal',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 18000,
    metrosCuadrados: '32-40',
    tipoGas: 'R32',
    precioNeto: 365000,
    precioConIVA: 474500,
    precioMaterial: 504500,
    valorLogistica: 40150,
    valorMaterial: 30000,
    precioCliente: 683000,
    precioClienteNeto: 574789,
    precioClienteIVA: 108211,
    valorEquipoMaterialIVA: 504500,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Kendal',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 24000,
    metrosCuadrados: '45-50',
    tipoGas: 'R32',
    precioNeto: 430000,
    precioConIVA: 559000,
    precioMaterial: 589000,
    valorLogistica: 47300,
    valorMaterial: 30000,
    precioCliente: 767500,
    precioClienteNeto: 644958,
    precioClienteIVA: 122542,
    valorEquipoMaterialIVA: 589000,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 1,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },

  // VESTA - SPLIT MURO INV. Wi-Fi
  {
    tipo: 'Split Muro',
    marca: 'Vesta',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 9000,
    metrosCuadrados: '16-18',
    tipoGas: 'R32',
    precioNeto: 199000,
    precioConIVA: 258700,
    precioMaterial: 278700,
    valorLogistica: 21890,
    valorMaterial: 20000,
    precioCliente: 421500,
    precioClienteNeto: 354202,
    precioClienteIVA: 67298,
    valorEquipoMaterialIVA: 278700,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 5,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Vesta',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 12000,
    metrosCuadrados: '24-30',
    tipoGas: 'R32',
    precioNeto: 220000,
    precioConIVA: 286000,
    precioMaterial: 306000,
    valorLogistica: 24200,
    valorMaterial: 20000,
    precioCliente: 448800,
    precioClienteNeto: 377143,
    precioClienteIVA: 71657,
    valorEquipoMaterialIVA: 306000,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 4,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Vesta',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 18000,
    metrosCuadrados: '32-40',
    tipoGas: 'R32',
    precioNeto: 340000,
    precioConIVA: 442000,
    precioMaterial: 472000,
    valorLogistica: 37400,
    valorMaterial: 30000,
    precioCliente: 650500,
    precioClienteNeto: 546639,
    precioClienteIVA: 103861,
    valorEquipoMaterialIVA: 472000,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 3,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Vesta',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 24000,
    metrosCuadrados: '45-50',
    tipoGas: 'R32',
    precioNeto: 430000,
    precioConIVA: 559000,
    precioMaterial: 589000,
    valorLogistica: 47300,
    valorMaterial: 20000,
    precioCliente: 767500,
    precioClienteNeto: 644958,
    precioClienteIVA: 122542,
    valorEquipoMaterialIVA: 589000,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },

  // ANWO - SPLIT MURO INFINITY INV. Wi-Fi
  {
    tipo: 'Split Muro',
    marca: 'ANWO',
    modelo: 'SPLIT MURO INFINITY INV. Wi-Fi',
    capacidadBTU: 9000,
    metrosCuadrados: '16-18',
    tipoGas: 'R32',
    precioNeto: 235000,
    precioConIVA: 305500,
    precioMaterial: 325500,
    valorLogistica: 25850,
    valorMaterial: 20000,
    precioCliente: 468300,
    precioClienteNeto: 393529,
    precioClienteIVA: 74771,
    valorEquipoMaterialIVA: 325500,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 3,
    caracteristicas: 'WiFi, Inverter, Infinity',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'ANWO',
    modelo: 'SPLIT MURO INFINITY INV. Wi-Fi',
    capacidadBTU: 12000,
    metrosCuadrados: '24-30',
    tipoGas: 'R32',
    precioNeto: 262000,
    precioConIVA: 340500,
    precioMaterial: 360600,
    valorLogistica: 28820,
    valorMaterial: 20000,
    precioCliente: 503400,
    precioClienteNeto: 423025,
    precioClienteIVA: 80375,
    valorEquipoMaterialIVA: 360600,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 3,
    caracteristicas: 'WiFi, Inverter, Infinity',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'ANWO',
    modelo: 'SPLIT MURO INFINITY INV. Wi-Fi',
    capacidadBTU: 18000,
    metrosCuadrados: '32-40',
    tipoGas: 'R32',
    precioNeto: 379000,
    precioConIVA: 492700,
    precioMaterial: 522700,
    valorLogistica: 41690,
    valorMaterial: 30000,
    precioCliente: 701200,
    precioClienteNeto: 589328,
    precioClienteIVA: 111872,
    valorEquipoMaterialIVA: 522700,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter, Infinity',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'ANWO',
    modelo: 'SPLIT MURO INFINITY INV. Wi-Fi',
    capacidadBTU: 24000,
    metrosCuadrados: '45-50',
    tipoGas: 'R32',
    codigoModelo: 'GES24ECO-INV-R32',
    precioNeto: 459000,
    precioConIVA: 596700,
    precioMaterial: 626700,
    valorLogistica: 50490,
    valorMaterial: 30000,
    precioCliente: 805200,
    precioClienteNeto: 678539,
    precioClienteIVA: 126661,
    valorEquipoMaterialIVA: 626700,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter, Infinity, APP ANWO HOME',
    estado: 'disponible'
  },

  // ANWO - VENTANA GREE
  {
    tipo: 'Ventana',
    marca: 'ANWO',
    modelo: 'VENTANA GREE',
    capacidadBTU: 9000,
    metrosCuadrados: 'n/a',
    tipoGas: 'R32',
    precioNeto: 280000,
    precioConIVA: 364000,
    precioMaterial: 384000,
    valorLogistica: 30800,
    valorMaterial: 20000,
    precioCliente: 526800,
    precioClienteNeto: 442889,
    precioClienteIVA: 84111,
    valorEquipoMaterialIVA: 384000,
    gananciaDescontandoIVA: 120000,
    gananciaDescontandoTecnicos: 90000,
    stock: 2,
    caracteristicas: 'Ventana, GREE',
    estado: 'disponible'
  },

  // SAMSUNG - WIND FREE INV.
  {
    tipo: 'Split Muro',
    marca: 'Samsung',
    modelo: 'WIND FREE INV.',
    capacidadBTU: 9000,
    metrosCuadrados: '16-20',
    tipoGas: 'R410',
    precioNeto: 0,
    precioConIVA: 0,
    precioMaterial: 0,
    valorLogistica: 0,
    valorMaterial: 0,
    precioCliente: 0,
    precioClienteNeto: 0,
    precioClienteIVA: 0,
    valorEquipoMaterialIVA: 0,
    gananciaDescontandoIVA: 0,
    gananciaDescontandoTecnicos: 0,
    stock: 0,
    caracteristicas: 'Wind Free, Inverter',
    estado: 'agotado'
  },
  {
    tipo: 'Split Muro',
    marca: 'Samsung',
    modelo: 'WIND FREE INV.',
    capacidadBTU: 12000,
    metrosCuadrados: '24-30',
    tipoGas: 'R410',
    precioNeto: 335000,
    precioConIVA: 435500,
    precioMaterial: 465500,
    valorLogistica: 36850,
    valorMaterial: 30000,
    precioCliente: 644000,
    precioClienteNeto: 541176,
    precioClienteIVA: 102824,
    valorEquipoMaterialIVA: 465500,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'Wind Free, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Samsung',
    modelo: 'WIND FREE INV.',
    capacidadBTU: 18000,
    metrosCuadrados: '32-40',
    tipoGas: 'R410',
    precioNeto: 476000,
    precioConIVA: 618800,
    precioMaterial: 648800,
    valorLogistica: 52360,
    valorMaterial: 30000,
    precioCliente: 827300,
    precioClienteNeto: 695210,
    precioClienteIVA: 132090,
    valorEquipoMaterialIVA: 648800,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 1,
    caracteristicas: 'Wind Free, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Samsung',
    modelo: 'WIND FREE INV.',
    capacidadBTU: 24000,
    metrosCuadrados: '45-50',
    tipoGas: 'R410',
    precioNeto: 0,
    precioConIVA: 0,
    precioMaterial: 0,
    valorLogistica: 0,
    valorMaterial: 0,
    precioCliente: 0,
    precioClienteNeto: 0,
    precioClienteIVA: 0,
    valorEquipoMaterialIVA: 0,
    gananciaDescontandoIVA: 0,
    gananciaDescontandoTecnicos: 0,
    stock: 0,
    caracteristicas: 'Wind Free, Inverter',
    estado: 'agotado'
  },

  // CLARK - SPLIT MURO INV. Wi-Fi
  {
    tipo: 'Split Muro',
    marca: 'Clark',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 9000,
    metrosCuadrados: 'R-32',
    tipoGas: 'R32',
    precioNeto: 215000,
    precioConIVA: 279500,
    precioMaterial: 299500,
    valorLogistica: 23650,
    valorMaterial: 20000,
    precioCliente: 442000,
    precioClienteNeto: 371429,
    precioClienteIVA: 70571,
    valorEquipoMaterialIVA: 299500,
    gananciaDescontandoIVA: 119748,
    gananciaDescontandoTecnicos: 89748,
    stock: 4,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Clark',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 12000,
    metrosCuadrados: 'R-32',
    tipoGas: 'R32',
    precioNeto: 225000,
    precioConIVA: 292700,
    precioMaterial: 317700,
    valorLogistica: 25190,
    valorMaterial: 20000,
    precioCliente: 460200,
    precioClienteNeto: 386723,
    precioClienteIVA: 73477,
    valorEquipoMaterialIVA: 317700,
    gananciaDescontandoIVA: 119748,
    gananciaDescontandoTecnicos: 89748,
    stock: 3,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Clark',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 18000,
    metrosCuadrados: 'R-32',
    tipoGas: 'R32',
    precioNeto: 355000,
    precioConIVA: 461500,
    precioMaterial: 491500,
    valorLogistica: 39050,
    valorMaterial: 30000,
    precioCliente: 670000,
    precioClienteNeto: 563025,
    precioClienteIVA: 106975,
    valorEquipoMaterialIVA: 491500,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 2,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Clark',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 24000,
    metrosCuadrados: 'R-32',
    tipoGas: 'R32',
    precioNeto: 455000,
    precioConIVA: 591500,
    precioMaterial: 621500,
    valorLogistica: 50050,
    valorMaterial: 30000,
    precioCliente: 800000,
    precioClienteNeto: 672269,
    precioClienteIVA: 127731,
    valorEquipoMaterialIVA: 621500,
    gananciaDescontandoIVA: 150000,
    gananciaDescontandoTecnicos: 120000,
    stock: 1,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  },
  {
    tipo: 'Split Muro',
    marca: 'Clark',
    modelo: 'SPLIT MURO INV. Wi-Fi',
    capacidadBTU: 36000,
    metrosCuadrados: 'R-32',
    tipoGas: 'R32',
    precioNeto: 670000,
    precioConIVA: 871000,
    precioMaterial: 911000,
    valorLogistica: 73700,
    valorMaterial: 40000,
    precioCliente: 1119500,
    precioClienteNeto: 940756,
    precioClienteIVA: 178744,
    valorEquipoMaterialIVA: 911000,
    gananciaDescontandoIVA: 175210,
    gananciaDescontandoTecnicos: 145210,
    stock: 1,
    caracteristicas: 'WiFi, Inverter',
    estado: 'disponible'
  }
]

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n')

  try {
    // 1. CREAR/ACTUALIZAR USUARIOS ADMINISTRADORES
    console.log('👤 Creando usuarios administradores...')
    for (const adminData of ADMIN_USERS) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10)
      
      const user = await prisma.user.upsert({
        where: { email: adminData.email },
        update: {}, // No actualizar si existe
        create: {
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          username: adminData.username,
          role: 'admin',
          isActive: true
        }
      })

      console.log(`✅ Usuario admin: ${user.email}`)
    }

    // 2. CREAR/ACTUALIZAR INVENTARIO DE PRODUCTOS
    console.log('\n📦 Poblando inventario con productos...')
    let productosCreados = 0
    
    for (const producto of INVENTARIO_DATA) {
      // Crear identificador único para cada producto
      const serieUnica = producto.codigoModelo || `${producto.marca}-${producto.modelo.replace(/\s+/g, '-')}-${producto.capacidadBTU}BTU`
      
      const inventario = await prisma.inventario.upsert({
        where: { numeroSerie: serieUnica },
        update: {
          // Actualizar stock y estado si ya existe
          stock: producto.stock,
          estado: producto.estado
        },
        create: {
          ...producto,
          numeroSerie: serieUnica
        }
      })

      productosCreados++
      console.log(`✅ ${productosCreados}/${INVENTARIO_DATA.length} - ${inventario.marca} ${inventario.modelo} ${inventario.capacidadBTU} BTU`)
    }

    console.log('\n🎉 Seed completado exitosamente!')
    console.log(`📊 Total usuarios administradores: ${ADMIN_USERS.length}`)
    console.log(`📦 Total productos en inventario: ${productosCreados}`)

  } catch (error) {
    console.error('❌ Error en seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
