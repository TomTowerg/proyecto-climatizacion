import express from 'express'
import { 
  getOrdenesTrabajo, 
  getOrdenTrabajoById, 
  createOrdenTrabajo, 
  updateOrdenTrabajo, 
  deleteOrdenTrabajo,
  completarOrden,
  getEstadisticas,
  generarPDF,
  subirDocumentoFirmado,
  descargarDocumentoFirmado,
  upload
} from '../controllers/ordenTrabajoController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Obtener estadísticas (debe ir antes de /:id)
router.get('/estadisticas', authenticate, getEstadisticas)

// Obtener todas las órdenes de trabajo
router.get('/', authenticate, getOrdenesTrabajo)

// ⭐ GENERAR PDF DE ORDEN DE TRABAJO
router.get('/:id/pdf', authenticate, generarPDF)

// ⭐ SUBIR DOCUMENTO FIRMADO
router.post('/:id/documento-firmado', authenticate, upload.single('documento'), subirDocumentoFirmado)

// ⭐ DESCARGAR DOCUMENTO FIRMADO
router.get('/:id/documento-firmado', authenticate, descargarDocumentoFirmado)

// Obtener orden de trabajo por ID
router.get('/:id', authenticate, getOrdenTrabajoById)

// Crear orden de trabajo
router.post('/', authenticate, createOrdenTrabajo)

// Actualizar orden de trabajo
router.put('/:id', authenticate, updateOrdenTrabajo)

// Completar orden de trabajo
router.patch('/:id/completar', authenticate, completarOrden)

// Eliminar orden de trabajo
router.delete('/:id', authenticate, deleteOrdenTrabajo)

export default router