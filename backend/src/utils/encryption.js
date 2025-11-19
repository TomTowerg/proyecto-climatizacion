// ============================================
// SISTEMA DE CIFRADO PARA DATOS PERSONALES
// backend/src/utils/encryption.js
// ============================================

import crypto from 'crypto'

// Configuración
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Generar clave de cifrado desde variable de entorno
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY
  
  if (!secret) {
    throw new Error('ENCRYPTION_KEY no está definida en variables de entorno')
  }
  
  // Derivar una clave de 32 bytes desde el secret
  return crypto.scryptSync(secret, 'salt', KEY_LENGTH)
}

// ============================================
// CIFRAR DATOS
// ============================================
export function encrypt(text) {
  if (!text) return null
  
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Error al cifrar:', error)
    throw new Error('Error al cifrar datos')
  }
}

// ============================================
// DESCIFRAR DATOS
// ============================================
export function decrypt(encryptedData) {
  if (!encryptedData) return null
  
  try {
    const key = getEncryptionKey()
    
    // Separar componentes
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Formato de datos cifrados inválido')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Error al descifrar:', error)
    throw new Error('Error al descifrar datos')
  }
}

// ============================================
// HASH DE UNA VÍA (Para RUT, emails - búsquedas)
// ============================================
export function hash(text) {
  if (!text) return null
  
  const secret = process.env.ENCRYPTION_KEY
  return crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex')
}

// ============================================
// FUNCIONES DE AYUDA PARA DATOS ESPECÍFICOS
// ============================================

// RUT (Cifrado reversible para mostrar, hash para buscar)
export function encryptRUT(rut) {
  return {
    encrypted: encrypt(rut),
    hash: hash(rut) // Para búsquedas
  }
}

export function decryptRUT(encryptedRUT) {
  return decrypt(encryptedRUT)
}

// Email (Cifrado reversible para envío, hash para búsquedas)
export function encryptEmail(email) {
  return {
    encrypted: encrypt(email.toLowerCase()),
    hash: hash(email.toLowerCase())
  }
}

export function decryptEmail(encryptedEmail) {
  return decrypt(encryptedEmail)
}

// Teléfono
export function encryptPhone(phone) {
  return encrypt(phone)
}

export function decryptPhone(encryptedPhone) {
  return decrypt(encryptedPhone)
}

// Dirección
export function encryptAddress(address) {
  return encrypt(address)
}

export function decryptAddress(encryptedAddress) {
  return decrypt(encryptedAddress)
}

// ============================================
// MIDDLEWARE PARA CIFRADO AUTOMÁTICO
// ============================================

export function encryptSensitiveFields(data) {
  const result = { ...data }
  
  // Campos a cifrar
  if (result.rut) {
    const { encrypted, hash } = encryptRUT(result.rut)
    result.rut_encrypted = encrypted
    result.rut_hash = hash
    delete result.rut
  }
  
  if (result.email) {
    const { encrypted, hash } = encryptEmail(result.email)
    result.email_encrypted = encrypted
    result.email_hash = hash
    delete result.email
  }
  
  if (result.telefono) {
    result.telefono_encrypted = encryptPhone(result.telefono)
    delete result.telefono
  }
  
  if (result.direccion) {
    result.direccion_encrypted = encryptAddress(result.direccion)
    delete result.direccion
  }
  
  return result
}

export function decryptSensitiveFields(data) {
  if (!data) return null
  
  const result = { ...data }
  
  // Descifrar campos
  if (result.rut_encrypted) {
    result.rut = decryptRUT(result.rut_encrypted)
    delete result.rut_encrypted
    delete result.rut_hash
  }
  
  if (result.email_encrypted) {
    result.email = decryptEmail(result.email_encrypted)
    delete result.email_encrypted
    delete result.email_hash
  }
  
  if (result.telefono_encrypted) {
    result.telefono = decryptPhone(result.telefono_encrypted)
    delete result.telefono_encrypted
  }
  
  if (result.direccion_encrypted) {
    result.direccion = decryptAddress(result.direccion_encrypted)
    delete result.direccion_encrypted
  }
  
  return result
}

// ============================================
// EJEMPLO DE USO:
// ============================================
/*
// En authController.js o clientesController.js

import { encryptSensitiveFields, decryptSensitiveFields } from '../utils/encryption.js'

// Al CREAR cliente:
const clienteData = {
  nombre: 'Juan Pérez',
  rut: '12345678-9',
  email: 'juan@example.com',
  telefono: '+56912345678',
  direccion: 'Calle Falsa 123'
}

const encryptedData = encryptSensitiveFields(clienteData)
const cliente = await prisma.cliente.create({ data: encryptedData })

// Al LEER cliente:
const clienteDB = await prisma.cliente.findUnique({ where: { id } })
const clienteDecrypted = decryptSensitiveFields(clienteDB)
res.json(clienteDecrypted)

// Al BUSCAR por RUT:
const { hash } = encryptRUT(rutABuscar)
const cliente = await prisma.cliente.findFirst({
  where: { rut_hash: hash }
})
*/

// ============================================
// MIGRACIÓN DE DATOS EXISTENTES
// ============================================
export async function migrateExistingData(prisma) {
  console.log('🔐 Iniciando migración de datos sensibles...')
  
  try {
    // Obtener todos los clientes
    const clientes = await prisma.cliente.findMany()
    
    for (const cliente of clientes) {
      // Si ya está cifrado, saltar
      if (cliente.rut_encrypted) continue
      
      const updates = {}
      
      if (cliente.rut) {
        const { encrypted, hash } = encryptRUT(cliente.rut)
        updates.rut_encrypted = encrypted
        updates.rut_hash = hash
      }
      
      if (cliente.email) {
        const { encrypted, hash } = encryptEmail(cliente.email)
        updates.email_encrypted = encrypted
        updates.email_hash = hash
      }
      
      if (cliente.telefono) {
        updates.telefono_encrypted = encryptPhone(cliente.telefono)
      }
      
      if (cliente.direccion) {
        updates.direccion_encrypted = encryptAddress(cliente.direccion)
      }
      
      // Actualizar cliente
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: updates
      })
      
      console.log(`✅ Cliente ${cliente.id} migrado`)
    }
    
    console.log('✅ Migración completada')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    throw error
  }
}
