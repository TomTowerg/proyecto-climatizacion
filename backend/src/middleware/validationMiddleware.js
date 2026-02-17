// ============================================
// MIDDLEWARE DE VALIDACIÓN DE INPUTS
// Crear nuevo: backend/src/middleware/validationMiddleware.js
// ============================================

import { body, param, query, validationResult } from 'express-validator'

// ============================================
// MANEJAR ERRORES DE VALIDACIÓN
// ============================================
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    })
  }

  next()
}

// ============================================
// VALIDACIONES PARA AUTENTICACIÓN
// ============================================

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .trim(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('El username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El username solo puede contener letras, números y guiones bajos'),

  handleValidationErrors
]

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .trim(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA CLIENTES
// ============================================

// Validar RUT chileno (acepta con y sin puntos: 12.345.678-9 o 12345678-9)
const validateRUT = (rut) => {
  // Limpiar puntos antes de validar
  const rutLimpio = rut.replace(/\./g, '')
  const rutRegex = /^[0-9]{7,8}-[0-9Kk]$/
  if (!rutRegex.test(rutLimpio)) {
    return false
  }

  const [numero, dv] = rutLimpio.split('-')
  let suma = 0
  let multiplicador = 2

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const dvCalculado = 11 - (suma % 11)
  const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString()

  return dv.toUpperCase() === dvFinal
}

export const validateCliente = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('rut')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateRUT(value)) {
        throw new Error('RUT inválido. Formato: 12345678-9 o 12.345.678-9')
      }
      return true
    }),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .trim(),

  body('telefono')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s()-]{7,20}$/)
    .withMessage('Teléfono inválido'),

  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La dirección no puede exceder 500 caracteres'),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA EQUIPOS
// ============================================

export const validateEquipo = [
  body('tipo')
    .trim()
    .notEmpty()
    .withMessage('El tipo de equipo es requerido')
    .isIn(['Split', 'Cassette', 'Piso Techo', 'Ventana', 'Portátil', 'Ducto'])
    .withMessage('Tipo de equipo inválido'),

  body('marca')
    .trim()
    .notEmpty()
    .withMessage('La marca es requerida')
    .isLength({ max: 100 })
    .withMessage('La marca no puede exceder 100 caracteres'),

  body('modelo')
    .trim()
    .notEmpty()
    .withMessage('El modelo es requerido')
    .isLength({ max: 100 })
    .withMessage('El modelo no puede exceder 100 caracteres'),

  body('numeroSerie')
    .trim()
    .notEmpty()
    .withMessage('El número de serie es requerido')
    .isLength({ max: 100 })
    .withMessage('El número de serie no puede exceder 100 caracteres'),

  body('capacidad')
    .trim()
    .notEmpty()
    .withMessage('La capacidad es requerida')
    .matches(/^\d+\s?(BTU|btu|W|w|kW|TR)?$/)
    .withMessage('Capacidad inválida. Ejemplo: 12000 BTU'),

  body('tipoGas')
    .trim()
    .notEmpty()
    .withMessage('El tipo de gas es requerido')
    .isIn(['R32', 'R410A', 'R22', 'R134a', 'R407C'])
    .withMessage('Tipo de gas inválido'),

  body('ano')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Año inválido'),

  body('clienteId')
    .isInt({ min: 1 })
    .withMessage('Cliente ID inválido'),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA ÓRDENES DE TRABAJO
// ============================================

export const validateOrdenTrabajo = [
  body('clienteId')
    .isInt({ min: 1 })
    .withMessage('Cliente ID inválido'),

  body('tipo')
    .trim()
    .notEmpty()
    .withMessage('El tipo de trabajo es requerido')
    .isIn(['instalacion', 'mantencion', 'mantenimiento', 'reparacion'])
    .withMessage('Tipo de trabajo inválido'),

  body('tecnico')
    .trim()
    .notEmpty()
    .withMessage('El técnico es requerido')
    .isLength({ max: 200 })
    .withMessage('El nombre del técnico no puede exceder 200 caracteres'),

  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),

  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden exceder 2000 caracteres'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'en_proceso', 'completado'])
    .withMessage('Estado inválido'),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA COTIZACIONES
// ============================================

export const validateCotizacion = [
  body('clienteId')
    .isInt({ min: 1 })
    .withMessage('Cliente ID inválido'),

  body('tipo')
    .optional()
    .trim(),

  body('marca')
    .optional()
    .trim(),

  body('modelo')
    .optional()
    .trim(),

  body('capacidad')
    .optional()
    .trim(),

  body('precioOfertado')
    .isFloat({ min: 0 })
    .withMessage('Precio ofertado debe ser un número positivo'),

  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal debe ser un número positivo'),

  body('precioFinal')
    .isFloat({ min: 0 })
    .withMessage('Precio final debe ser un número positivo'),

  body('costoInstalacion')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo de instalación debe ser un número positivo'),

  body('descuento')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Descuento debe ser un número positivo'),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA PARÁMETROS DE URL
// ============================================

export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido'),

  handleValidationErrors
]

export const validateRutParam = [
  param('rut')
    .custom((value) => {
      if (!validateRUT(value)) {
        throw new Error('RUT inválido. Formato: 12345678-9')
      }
      return true
    }),

  handleValidationErrors
]

// ============================================
// VALIDACIONES PARA QUERIES
// ============================================

export const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query de búsqueda debe tener entre 1 y 100 caracteres'),

  handleValidationErrors
]

export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),

  handleValidationErrors
]

// ============================================
// EJEMPLO DE USO EN RUTAS:
// ============================================
/*
import { 
  validateCliente, 
  validateId, 
  handleValidationErrors 
} from '../middleware/validationMiddleware.js'

// Crear cliente con validación
router.post('/clientes', validateCliente, crearCliente)

// Obtener cliente por ID con validación
router.get('/clientes/:id', validateId, obtenerCliente)

// Buscar con validación de query
router.get('/clientes/search', validateSearchQuery, buscarClientes)
*/