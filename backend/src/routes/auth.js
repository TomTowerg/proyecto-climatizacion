// ============================================
// RUTAS DE AUTENTICACIÓN CON RATE LIMITING
// ============================================

import express from 'express'
import prisma from '../utils/prisma.js'
import {
  register,
  login,
  googleLogin,
  verifyToken,
  changePassword
} from '../controllers/authController.js'
import { loginLimiter, registerLimiter, strictLimiter } from '../middleware/rateLimiter.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// ============================================
// RUTAS PÚBLICAS (Con Rate Limiting)
// ============================================

// Registro - Máximo 3 intentos por hora
router.post('/register', registerLimiter, register)

// Login - Máximo 5 intentos cada 15 minutos
router.post('/login', loginLimiter, login)

// Login con Google - Rate limiting normal
router.post('/google', loginLimiter, googleLogin)

// Verificar token - Sin rate limiting estricto (se usa frecuentemente)
router.get('/verify', verifyToken)

// ============================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================

// Cambiar contraseña - Requiere estar logueado + rate limiting estricto
router.post('/change-password',
  authenticate,
  strictLimiter,
  changePassword
)

// Obtener perfil del usuario actual
router.get('/me', authenticate, async (req, res) => {
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
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
})

export default router