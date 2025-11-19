// ============================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// Crear nuevo: backend/src/middleware/authMiddleware.js
// ============================================

import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

// ============================================
// VERIFICAR TOKEN JWT
// ============================================
export const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado' 
      })
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Usuario desactivado. Contacta al administrador' 
      })
    }

    // Agregar información del usuario a req
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado. Por favor inicia sesión nuevamente' 
      })
    }

    console.error('Error en autenticación:', error)
    res.status(500).json({ 
      error: 'Error al verificar autenticación' 
    })
  }
}

// ============================================
// VERIFICAR ROL DE ADMINISTRADOR
// ============================================
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador' 
    })
  }
  next()
}

// ============================================
// VERIFICAR ROLES ESPECÍFICOS
// ============================================
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}` 
      })
    }
    next()
  }
}

// ============================================
// EJEMPLO DE USO EN RUTAS:
// ============================================
/*
import { authenticateToken, requireAdmin, requireRole } from '../middleware/authMiddleware.js'

// Ruta protegida (solo usuarios logueados)
router.get('/clientes', authenticateToken, obtenerClientes)

// Ruta solo para administradores
router.delete('/usuarios/:id', authenticateToken, requireAdmin, eliminarUsuario)

// Ruta para roles específicos
router.post('/inventario', authenticateToken, requireRole('admin', 'manager'), crearInventario)
*/