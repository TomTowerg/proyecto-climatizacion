// ============================================
// SCRIPT DE MIGRACIÓN DE DATOS
// Archivo nuevo: backend/src/scripts/migrateData.js
// ============================================

import prisma from '../utils/prisma.js'
import { encryptSensitiveFields } from '../utils/encryption.js'

async function migrateClientData() {
  console.log('🔐 Iniciando migración de datos sensibles...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // Obtener todos los clientes
    const clientes = await prisma.cliente.findMany()
    
    console.log(`📊 Total de clientes a migrar: ${clientes.length}`)
    console.log('')
    
    let migrated = 0
    let skipped = 0
    let errors = 0
    
    for (const cliente of clientes) {
      try {
        // Si ya está cifrado, saltar
        if (cliente.rut_encrypted) {
          console.log(`⏭️  Cliente ${cliente.id} (${cliente.nombre}) - Ya migrado`)
          skipped++
          continue
        }
        
        // Preparar datos para cifrar
        const datosParaCifrar = {
          nombre: cliente.nombre, // No se cifra
        }
        
        if (cliente.rut) {
          datosParaCifrar.rut = cliente.rut
        }
        if (cliente.email) {
          datosParaCifrar.email = cliente.email
        }
        if (cliente.telefono) {
          datosParaCifrar.telefono = cliente.telefono
        }
        if (cliente.direccion) {
          datosParaCifrar.direccion = cliente.direccion
        }
        
        // Cifrar datos
        const datosCifrados = encryptSensitiveFields(datosParaCifrar)
        
        // Actualizar cliente
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: datosCifrados
        })
        
        console.log(`✅ Cliente ${cliente.id} (${cliente.nombre}) - Migrado exitosamente`)
        migrated++
        
      } catch (error) {
        console.error(`❌ Error migrando cliente ${cliente.id}:`, error.message)
        errors++
      }
    }
    
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 RESUMEN DE MIGRACIÓN:')
    console.log(`✅ Migrados exitosamente: ${migrated}`)
    console.log(`⏭️  Ya migrados (saltados): ${skipped}`)
    console.log(`❌ Errores: ${errors}`)
    console.log(`📦 Total: ${clientes.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (errors === 0 && migrated > 0) {
      console.log('')
      console.log('🎉 ¡Migración completada exitosamente!')
      console.log('')
      console.log('📝 PRÓXIMO PASO:')
      console.log('   Ahora puedes eliminar los campos antiguos del schema:')
      console.log('   - rut (mantener solo rut_encrypted y rut_hash)')
      console.log('   - email (mantener solo email_encrypted y email_hash)')
      console.log('   - telefono (mantener solo telefono_encrypted)')
      console.log('   - direccion (mantener solo direccion_encrypted)')
      console.log('')
      console.log('   Ejecutar: npx prisma migrate dev --name remove_old_fields')
    }
    
    if (errors > 0) {
      console.log('')
      console.log('⚠️  Hubo errores durante la migración.')
      console.log('   Revisa los errores y vuelve a ejecutar el script.')
    }
    
    if (migrated === 0 && skipped > 0) {
      console.log('')
      console.log('ℹ️  Todos los clientes ya están migrados.')
    }
    
  } catch (error) {
    console.error('❌ Error fatal en migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar migración
migrateClientData()
  .then(() => {
    console.log('')
    console.log('✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script falló:', error)
    process.exit(1)
  })