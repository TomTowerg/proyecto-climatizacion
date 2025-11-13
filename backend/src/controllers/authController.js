import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { generateToken } from '../utils/jwt.js'
import { isEmailAllowed, isDomainAllowed } from '../config/allowedEmails.js'

// Registro de usuario
export const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // VERIFICAR LISTA BLANCA
    if (!isEmailAllowed(email) && !isDomainAllowed(email)) {
      return res.status(403).json({ 
        error: 'Este email no está autorizado. Contacta al administrador.' 
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El usuario ya existe' 
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        name,
        role: 'user',
        isActive: true
      }
    })

    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    })

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ 
      error: 'Error al registrar usuario' 
    })
  }
}

// Login de usuario
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    // Verificar si está activo
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada. Contacta al administrador.' 
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    })

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ 
      error: 'Error al iniciar sesión' 
    })
  }
}

// Callback de Google OAuth
export const googleCallback = async (req, res) => {
  try {
    const user = req.user

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=google_auth_failed`)
    }

    // VERIFICAR LISTA BLANCA
    if (!isEmailAllowed(user.email) && !isDomainAllowed(user.email)) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=email_not_allowed`)
    }

    if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=account_disabled`)
    }

    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    })

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role
    }))}`)

  } catch (error) {
    console.error('Error en callback de Google:', error)
    res.redirect(`${process.env.FRONTEND_URL}/?error=server_error`)
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      })
    }

    res.json({ user })

  } catch (error) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({ 
      error: 'Error al obtener usuario' 
    })
  }
}

export const logout = async (req, res) => {
  res.json({ 
    message: 'Logout exitoso' 
  })
}