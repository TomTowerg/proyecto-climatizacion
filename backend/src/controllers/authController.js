// ============================================
// AUTH CONTROLLER CON WHITELIST SEGURA
// Variables de entorno - NO emails en código
// Reemplazar: backend/src/controllers/authController.js
// ============================================

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// ============================================
// WHITELIST DESDE VARIABLE DE ENTORNO
// ============================================
// Los emails se configuran en:
// - Local: backend/.env → ALLOWED_GOOGLE_EMAILS=email1@gmail.com,email2@gmail.com
// - Producción: Railway → Variables → ALLOWED_GOOGLE_EMAILS

const ALLOWED_GOOGLE_EMAILS = process.env.ALLOWED_GOOGLE_EMAILS
  ?.split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0) || []

// Log de configuración (sin mostrar emails completos en producción)
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔐 Whitelist configurada con ${ALLOWED_GOOGLE_EMAILS.length} email(s)`)
}

// Advertencia si no hay emails configurados
if (ALLOWED_GOOGLE_EMAILS.length === 0) {
  console.warn('⚠️ WARNING: ALLOWED_GOOGLE_EMAILS no está configurado')
  console.warn('⚠️ Nadie podrá hacer login con Google hasta que se configure')
}

// ============================================
// VALIDACIÓN DE CONTRASEÑA FUERTE
// ============================================
function validatePasswordStrength(password) {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    errors: [
      !minLength && 'La contraseña debe tener al menos 8 caracteres',
      !hasUpperCase && 'La contraseña debe tener al menos una letra mayúscula',
      !hasLowerCase && 'La contraseña debe tener al menos una letra minúscula',
      !hasNumber && 'La contraseña debe tener al menos un número'
    ].filter(Boolean)
  }
}

// ============================================
// REGISTRO
// ============================================
export const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido' 
      })
    }

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Contraseña débil',
        details: passwordValidation.errors
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        name,
        role: 'user',
        isActive: true
      }
    })

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      details: error.message 
    })
  }
}

// ============================================
// LOGIN
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.password) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Usuario desactivado. Contacta al administrador' 
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })

    const { password: _, ...userWithoutPassword } = user

    res.json({
      message: 'Login exitoso',
      token,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: error.message 
    })
  }
}

// ============================================
// LOGIN CON GOOGLE - WHITELIST SEGURA
// ============================================
export const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name } = req.body

    if (!googleId || !email) {
      return res.status(400).json({ 
        error: 'Datos de Google incompletos' 
      })
    }

    // ⭐ VERIFICAR WHITELIST (desde variable de entorno)
    const emailLower = email.toLowerCase()
    const isAllowed = ALLOWED_GOOGLE_EMAILS.includes(emailLower)

    if (!isAllowed) {
      // Log sin mostrar email completo en producción
      const maskedEmail = process.env.NODE_ENV === 'production' 
        ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : email
      
      console.log(`❌ Intento de acceso no autorizado: ${maskedEmail}`)
      
      return res.status(403).json({ 
        error: 'Acceso no autorizado',
        message: 'Tu email no tiene permiso para acceder a esta aplicación. Contacta al administrador si crees que esto es un error.'
      })
    }

    // Log de acceso exitoso
    const maskedEmail = process.env.NODE_ENV === 'production'
      ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : email
    console.log(`✅ Acceso autorizado: ${maskedEmail}`)

    // Buscar usuario por Google ID o email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: emailLower }
        ]
      }
    })

    // Si no existe, crear nuevo usuario como ADMIN
    if (!user) {
      console.log(`🆕 Creando nuevo usuario admin desde whitelist`)
      user = await prisma.user.create({
        data: {
          email: emailLower,
          googleId,
          name,
          role: 'admin', // ⭐ Whitelist = Admin
          isActive: true,
          password: null
        }
      })
    } else if (!user.googleId) {
      // Si existe por email pero no tiene googleId, agregarlo
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId,
          role: 'admin' // Asegurar rol admin
        }
      })
    } else {
      // Asegurar que tiene rol admin
      if (user.role !== 'admin') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' }
        })
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Usuario desactivado. Contacta al administrador' 
      })
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user

    res.json({
      message: 'Login con Google exitoso',
      token,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Error en Google login:', error)
    res.status(500).json({ 
      error: 'Error al iniciar sesión con Google',
      details: error.message 
    })
  }
}

// ============================================
// VERIFICAR TOKEN
// ============================================
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario desactivado' })
    }

    res.json({ 
      valid: true,
      user 
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    
    console.error('Error al verificar token:', error)
    res.status(500).json({ 
      error: 'Error al verificar token',
      details: error.message 
    })
  }
}

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.userId

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva son requeridas' 
      })
    }

    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Nueva contraseña débil',
        details: passwordValidation.errors
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.password) {
      return res.status(400).json({ 
        error: 'No se puede cambiar la contraseña' 
      })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Contraseña cambiada exitosamente' })

  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    res.status(500).json({ 
      error: 'Error al cambiar contraseña',
      details: error.message 
    })
  }
}
