/**
 * ARCHIVO DE COMPATIBILIDAD
 * Re-exporta las funciones de geminiService.js
 * Esto permite usar import { analizarUrgencia } from './iaService'
 * cuando el archivo real es geminiService.js
 */

export { 
  generarContenido,
  chatConContexto,
  analizarOrdenTrabajo,
  recomendarEquipo,
  analizarProblema,
  buscarEquipoConIA,
  analizarUrgencia
} from './geminiService.js'