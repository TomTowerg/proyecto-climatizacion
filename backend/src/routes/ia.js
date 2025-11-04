import express from 'express'
import { 
  traducir, 
  generarRecomendaciones, 
  analizarUrgencia, 
  chat 
} from '../controllers/iaController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Rutas de IA
router.post('/traducir', traducir)
router.post('/recomendaciones', generarRecomendaciones)
router.post('/analizar-urgencia', analizarUrgencia)
router.post('/chat', chat)

export default router