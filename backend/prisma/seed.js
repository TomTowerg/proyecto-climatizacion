import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// USUARIOS ADMINISTRADOR - CAMBIA ESTOS DATOS
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

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  for (const adminData of ADMIN_USERS) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10)
    
    const user = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        role: 'admin',
        isActive: true
      },
      create: {
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        username: adminData.username,
        role: 'admin',
        isActive: true
      }
    })

    console.log(`✅ Usuario admin creado/actualizado: ${user.email}`)
  }

  console.log('🎉 Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })