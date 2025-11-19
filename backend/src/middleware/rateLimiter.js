// ============================================
// MIDDLEWARE DE RATE LIMITING
// backend/src/middleware/rateLimiter.js
// ============================================

import rateLimit from 'express-rate-limit'

// Rate limiter para login (prevenir fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: {
    error: 'Demasiados intentos de login. Por favor intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
  // keyGenerator omitido - usa default que maneja IPv6 correctamente
})

// Rate limiter para registro (prevenir spam)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros máximo por hora
  message: {
    error: 'Demasiados registros desde esta IP. Por favor intenta más tarde.'
  }
})

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: {
    error: 'Demasiadas peticiones. Por favor intenta más tarde.'
  }
})

// Rate limiter estricto para operaciones sensibles
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos
  message: {
    error: 'Has excedido el límite de operaciones. Intenta en 1 hora.'
  }
})