import express from 'express'
import { register, login, getCurrentUser, logout } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Rutas públicas (no requieren autenticación)
router.post('/register', register)
router.post('/login', login)

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticate, getCurrentUser)
router.post('/logout', authenticate, logout)

export default router