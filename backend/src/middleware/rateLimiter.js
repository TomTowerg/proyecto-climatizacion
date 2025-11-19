// ============================================
// RATE LIMITER - COMPATIBLE CON RAILWAY
// backend/src/middleware/rateLimiter.js
// ============================================

import rateLimit from 'express-rate-limit'

// Login limiter (anti fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error: 'Demasiados intentos de login. Por favor intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
  // NO usar keyGenerator personalizado - el default maneja proxy correctamente
})

// Register limiter (anti spam)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros
  message: {
    error: 'Demasiados registros desde esta IP. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// API limiter general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: {
    error: 'Demasiadas peticiones. Por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Limiter estricto para operaciones sensibles
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    error: 'Has excedido el límite de operaciones. Intenta en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
})