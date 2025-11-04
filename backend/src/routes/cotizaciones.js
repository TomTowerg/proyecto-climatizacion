import express from 'express'
import { 
  getCotizaciones, 
  getCotizacionById, 
  createCotizacion, 
  updateCotizacion, 
  deleteCotizacion 
} from '../controllers/cotizacionController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de cotizaciones
router.get('/', getCotizaciones)
router.get('/:id', getCotizacionById)
router.post('/', createCotizacion)
router.put('/:id', updateCotizacion)
router.delete('/:id', deleteCotizacion)

export default router