// ============================================
// AUTH CONTROLLER CON WHITELIST EN REGISTRO Y GOOGLE
// Reemplazar: backend/src/controllers/authController.js
// ============================================

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// ============================================
// WHITELIST DESDE VARIABLE DE ENTORNO
// ============================================
// Configurar en:
// - Local: backend/.env → ALLOWED_GOOGLE_EMAILS=email1@gmail.com,email2@gmail.com
// - Railway: Variables → ALLOWED_GOOGLE_EMAILS

const ALLOWED_EMAILS = process.env.ALLOWED_GOOGLE_EMAILS
  ?.split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0) || []

// Log de configuración
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔐 Whitelist configurada con ${ALLOWED_EMAILS.length} email(s)`)
}

if (ALLOWED_EMAILS.length === 0) {
  console.warn('⚠️ WARNING: ALLOWED_GOOGLE_EMAILS no configurado')
  console.warn('⚠️ Solo permitirá registro/login con Google si se configura')
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
// REGISTRO CON VERIFICACIÓN DE WHITELIST
// ============================================
export const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido' 
      })
    }

    // ⭐ VERIFICAR WHITELIST - SOLO EMAILS PERMITIDOS
    const emailLower = email.toLowerCase()
    const isAllowed = ALLOWED_EMAILS.includes(emailLower)

    if (!isAllowed) {
      const maskedEmail = process.env.NODE_ENV === 'production' 
        ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : email
      
      console.log(`❌ Intento de registro no autorizado: ${maskedEmail}`)
      
      return res.status(403).json({ 
        error: 'Registro no autorizado',
        message: 'Tu email no está autorizado para registrarse en esta aplicación. Solo el personal autorizado puede crear una cuenta.'
      })
    }

    console.log(`✅ Registro autorizado: ${emailLower}`)

    // Validar fuerza de contraseña
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Contraseña débil',
        details: passwordValidation.errors
      })
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      })
    }

    // Hash de contraseña con bcrypt (12 rounds - más seguro)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario como ADMIN (porque está en whitelist)
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        username,
        password: hashedPassword,
        name,
        role: 'admin', // ⭐ Whitelist = Admin automático
        isActive: true
      }
    })

    console.log(`🆕 Nuevo admin registrado: ${emailLower}`)

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Respuesta sin password
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
// LOGIN CON GOOGLE - WHITELIST
// ============================================
export const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name } = req.body

    if (!googleId || !email) {
      return res.status(400).json({ 
        error: 'Datos de Google incompletos' 
      })
    }

    // ⭐ VERIFICAR WHITELIST
    const emailLower = email.toLowerCase()
    const isAllowed = ALLOWED_EMAILS.includes(emailLower)

    if (!isAllowed) {
      const maskedEmail = process.env.NODE_ENV === 'production' 
        ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : email
      
      console.log(`❌ Intento de acceso Google no autorizado: ${maskedEmail}`)
      
      return res.status(403).json({ 
        error: 'Acceso no autorizado',
        message: 'Tu email no tiene permiso para acceder a esta aplicación.'
      })
    }

    console.log(`✅ Acceso Google autorizado: ${emailLower}`)

    // Buscar usuario
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: emailLower }
        ]
      }
    })

    // Si no existe, crear como ADMIN
    if (!user) {
      console.log(`🆕 Creando nuevo usuario admin desde Google`)
      user = await prisma.user.create({
        data: {
          email: emailLower,
          googleId,
          name,
          role: 'admin',
          isActive: true,
          password: null
        }
      })
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId,
          role: 'admin'
        }
      })
    } else {
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