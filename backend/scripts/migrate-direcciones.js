import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migración de direcciones de clientes...')
  
  // Buscar clientes que NO tengan direcciones en la nueva tabla
  const clientes = await prisma.cliente.findMany({
    where: {
      direcciones: {
        none: {}
      }
    }
  })

  console.log(`Se encontraron ${clientes.length} clientes sin direcciones en el nuevo modelo.`)

  let migradas = 0
  let sinDireccion = 0

  for (const cliente of clientes) {
    // Revisar si el cliente tiene alguna dirección antigua (sea encriptada o texto plano heredada)
    const direccionAntigua = cliente.direccion_encrypted || cliente.direccion
    
    if (direccionAntigua && direccionAntigua.trim() !== '') {
      try {
        await prisma.direccionCliente.create({
          data: {
            clienteId: cliente.id,
            nombre: 'Principal', // Nombre por defecto
            direccion_encrypted: direccionAntigua,
            esPrincipal: true
          }
        })
        migradas++
        process.stdout.write('.')
      } catch (error) {
        console.error(`\nError migrando cliente ID ${cliente.id}:`, error.message)
      }
    } else {
      sinDireccion++
    }
  }

  console.log('\n--- Resumen de Migración ---')
  console.log(`Total analizados: ${clientes.length}`)
  console.log(`Direcciones migradas exitosamente: ${migradas}`)
  console.log(`Clientes sin dirección registrada: ${sinDireccion}`)
  console.log('----------------------------')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
