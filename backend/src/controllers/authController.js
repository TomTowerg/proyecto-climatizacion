import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { generateToken } from '../utils/jwt.js'

// Registro de usuario
export const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body

    // Validar que los campos requeridos existan
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ 
        error: 'El usuario ya existe' 
      })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        name
      }
    })

    // Generar token JWT
    const token = generateToken({ 
      userId: user.id, 
      email: user.email 
    })

    // Responder sin enviar la contraseña
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name
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

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      })
    }

    // Generar token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email 
    })

    // Responder con token y datos del usuario
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ 
      error: 'Error al iniciar sesión' 
    })
  }
}

// Obtener usuario actual (requiere autenticación)
export const getCurrentUser = async (req, res) => {
  try {
    // req.userId viene del middleware de autenticación
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
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

// Logout (opcional - frontend maneja eliminando el token)
export const logout = async (req, res) => {
  res.json({ 
    message: 'Logout exitoso' 
  })
}