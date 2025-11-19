// ============================================
// AUTH CONTROLLER MEJORADO
// Reemplazar: backend/src/controllers/authController.js
// ============================================

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// ============================================
// VALIDACIÓN DE CONTRASEÑA FUERTE
// ============================================
function validatePasswordStrength(password) {
  // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
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
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      })
    }

    // Hash de contraseña con bcrypt (12 rounds - más seguro)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
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

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.password) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Usuario desactivado. Contacta al administrador' 
      })
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

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

    // Actualizar última vez que se logueó (opcional)
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })

    // Respuesta sin password
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
// LOGIN CON GOOGLE (OAuth)
// ============================================
export const googleLogin = async (req, res) => {
  try {
    const { googleId, email, name } = req.body

    if (!googleId || !email) {
      return res.status(400).json({ 
        error: 'Datos de Google incompletos' 
      })
    }

    // Buscar usuario por Google ID o email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: email.toLowerCase() }
        ]
      }
    })

    // Si no existe, crear nuevo usuario
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          googleId,
          name,
          role: 'user',
          isActive: true,
          password: null // No tiene password (solo OAuth)
        }
      })
    } else if (!user.googleId) {
      // Si existe por email pero no tiene googleId, agregarlo
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      })
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Usuario desactivado. Contacta al administrador' 
      })
    }

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
    const userId = req.user.userId // Del middleware de autenticación

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva son requeridas' 
      })
    }

    // Validar fuerza de nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Nueva contraseña débil',
        details: passwordValidation.errors
      })
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.password) {
      return res.status(400).json({ 
        error: 'No se puede cambiar la contraseña' 
      })
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      })
    }

    // Hash de nueva contraseña (12 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña
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