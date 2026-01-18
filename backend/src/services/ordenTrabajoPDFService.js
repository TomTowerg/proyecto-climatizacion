import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decryptSensitiveFields } from '../utils/encryption.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ⭐ COLORES DEL LOGO KMTS
const COLORES = {
  azul: '#1E3A8A',      // Azul oscuro del logo
  azulClaro: '#3B82F6', // Azul brillante
  gris: '#64748B',      // Gris
  texto: '#1F2937',     // Texto principal
  linea: '#E5E7EB'      // Líneas divisorias
}

export const generarPDFOrdenTrabajo = async (orden) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de orden de trabajo #${orden.id}...`)

      // ⭐ VALIDAR DATOS MÍNIMOS REQUERIDOS
      if (!orden.cliente) {
        throw new Error('La orden de trabajo debe tener un cliente asociado')
      }

      // ⭐ DESCIFRAR DATOS DEL CLIENTE
      let clienteDescifrado = orden.cliente
      
      try {
        if (orden.cliente.rut_encrypted || 
            orden.cliente.email_encrypted || 
            orden.cliente.telefono_encrypted ||
            orden.cliente.direccion_encrypted) {
          console.log('🔓 Descifrando datos del cliente...')
          clienteDescifrado = decryptSensitiveFields(orden.cliente)
          console.log('✅ Datos descifrados exitosamente')
        }
      } catch (error) {
        console.log('⚠️  Error al descifrar datos del cliente:', error.message)
        // Continuar con datos sin descifrar
      }

      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => {
        console.log('✅ PDF de orden generado exitosamente')
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', (err) => {
        console.error('❌ Error en stream de PDF:', err)
        reject(err)
      })

      // ========================================
      // ENCABEZADO CON LOGO
      // ========================================
      
      // Buscar logo en múltiples ubicaciones
      const possibleLogoPaths = [
        path.join(__dirname, '../../public/logo-kmts.png'),
        path.resolve(__dirname, '../../../frontend/public/logo-kmts.png'),
        path.resolve(__dirname, '../../..', 'frontend', 'public', 'logo-kmts.png'),
      ]

      let logoLoaded = false
      for (const logoPath of possibleLogoPaths) {
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 50, 45, { width: 70, height: 70 })
            console.log('✅ Logo cargado desde:', logoPath)
            logoLoaded = true
            break
          } catch (error) {
            console.log('❌ Error al cargar logo:', error.message)
          }
        }
      }

      if (!logoLoaded) {
        console.log('⚠️  Logo no encontrado, usando texto')
        // Usar texto como fallback
        doc.fontSize(9)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('KMTS', 50, 50)
           .text('POWERTECH', 50, 62)
      }

      // Información de la empresa
      doc.fontSize(18)
         .fillColor(COLORES.azul)
         .font('Helvetica-Bold')
         .text('KMTS POWER TECH', 140, 50)
      
      doc.fontSize(10)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Climatización y Servicios', 140, 72)
         .text('www.kmtspowertech.com', 140, 86)
         .text('contacto@kmtspowertech.com', 140, 100)

      // ORDEN DE TRABAJO (derecha)
      doc.fontSize(24)
         .fillColor(COLORES.azulClaro)
         .font('Helvetica-Bold')
         .text('ORDEN DE TRABAJO', 320, 50, { align: 'right' })
      
      doc.fontSize(12)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text(`N° ${orden.id.toString().padStart(6, '0')}`, 320, 78, { align: 'right' })

      // Línea divisoria
      doc.moveTo(50, 130)
         .lineTo(562, 130)
         .strokeColor(COLORES.linea)
         .lineWidth(2)
         .stroke()

      let yPos = 150

      // ========================================
      // INFORMACIÓN GENERAL
      // ========================================
      
      doc.fontSize(14)
         .fillColor(COLORES.azul)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN GENERAL', 50, yPos)

      yPos += 25

      // Información en dos columnas
      const colIzq = 50
      const colDer = 320

      doc.fontSize(10)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Fecha:', colIzq, yPos)
      
      // ⭐ MANEJO SEGURO DE FECHA
      const fechaOrden = orden.fecha || orden.fechaInicio || orden.createdAt || new Date()
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(new Date(fechaOrden).toLocaleDateString('es-CL'), colIzq + 100, yPos)

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Tipo de Servicio:', colDer, yPos)
      
      const tipoTexto = {
        instalacion: 'Instalación',
        mantencion: 'Mantención',
        reparacion: 'Reparación'
      }[orden.tipo] || (orden.tipo || 'N/A')

      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(tipoTexto, colDer + 100, yPos)

      yPos += 20

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Técnico:', colIzq, yPos)
      
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(orden.tecnico || 'Por asignar', colIzq + 100, yPos)

      // ⭐ MANEJO SEGURO DE URGENCIA
      const urgencia = orden.urgencia || orden.prioridad || 'media'
      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Urgencia:', colDer, yPos)
      
      const urgenciaColor = {
        baja: '#10B981',
        media: '#F59E0B',
        alta: '#EF4444',
        critica: '#EF4444'
      }[urgencia] || COLORES.texto

      doc.fillColor(urgenciaColor)
         .font('Helvetica-Bold')
         .text(urgencia.toUpperCase(), colDer + 100, yPos)

      yPos += 20

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Estado:', colIzq, yPos)
      
      const estadoColor = {
        pendiente: '#F59E0B',
        en_proceso: '#3B82F6',
        completado: '#10B981',
        completada: '#10B981'
      }[orden.estado] || COLORES.texto

      const estadoTexto = {
        pendiente: 'Pendiente',
        en_proceso: 'En Proceso',
        completado: 'Completado',
        completada: 'Completada'
      }[orden.estado] || (orden.estado || 'Pendiente')

      doc.fillColor(estadoColor)
         .font('Helvetica-Bold')
         .text(estadoTexto, colIzq + 100, yPos)

      yPos += 35

      // ========================================
      // DATOS DEL CLIENTE
      // ========================================
      
      doc.fontSize(14)
         .fillColor(COLORES.azul)
         .font('Helvetica-Bold')
         .text('DATOS DEL CLIENTE', 50, yPos)

      yPos += 25

      doc.fontSize(10)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Nombre:', colIzq, yPos)
      
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(clienteDescifrado.nombre || 'Cliente', colIzq + 100, yPos)

      yPos += 20

      // ⭐ MANEJO SEGURO DE CAMPOS OPCIONALES DEL CLIENTE
      if (clienteDescifrado.rut) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('RUT:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(clienteDescifrado.rut, colIzq + 100, yPos)

        yPos += 20
      }

      if (clienteDescifrado.telefono) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Teléfono:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(clienteDescifrado.telefono, colIzq + 100, yPos)

        yPos += 20
      }

      if (clienteDescifrado.email) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Email:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica')
           .text(clienteDescifrado.email, colIzq + 100, yPos, { width: 400 })

        yPos += 20
      }

      if (clienteDescifrado.direccion) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Dirección:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica')
           .text(clienteDescifrado.direccion, colIzq + 100, yPos, { width: 400 })

        yPos += 30
      }

      yPos += 10

      // ========================================
      // EQUIPO
      // ========================================
      
      if (orden.equipo) {
        doc.fontSize(14)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('EQUIPO', 50, yPos)

        yPos += 25

        doc.fontSize(10)
           .fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Tipo:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.equipo.tipo || 'N/A', colIzq + 100, yPos)

        yPos += 20

        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Marca:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.equipo.marca || 'N/A', colIzq + 100, yPos)

        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Modelo:', colDer, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.equipo.modelo || 'N/A', colDer + 100, yPos)

        yPos += 20

        if (orden.equipo.numeroSerie) {
          doc.fillColor(COLORES.gris)
             .font('Helvetica')
             .text('N° Serie:', colIzq, yPos)
          
          doc.fillColor(COLORES.texto)
             .font('Helvetica-Bold')
             .text(orden.equipo.numeroSerie, colIzq + 100, yPos)

          yPos += 20
        }

        if (orden.equipo.capacidad) {
          doc.fillColor(COLORES.gris)
             .font('Helvetica')
             .text('Capacidad:', colIzq, yPos)
          
          doc.fillColor(COLORES.texto)
             .font('Helvetica-Bold')
             .text(orden.equipo.capacidad, colIzq + 100, yPos)

          yPos += 20
        }

        yPos += 10
      }

      // ========================================
      // DESCRIPCIÓN/NOTAS
      // ========================================
      
      // ⭐ MANEJO DE MÚLTIPLES CAMPOS DE DESCRIPCIÓN
      const descripcion = orden.descripcion || orden.notas || orden.trabajoRealizado
      
      if (descripcion) {
        doc.fontSize(14)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN DEL TRABAJO', 50, yPos)

        yPos += 25

        doc.fontSize(10)
           .fillColor(COLORES.texto)
           .font('Helvetica')
           .text(descripcion, 50, yPos, { width: 512, align: 'justify' })

        yPos += Math.max(60, doc.heightOfString(descripcion, { width: 512 }) + 20)
      }

      // ========================================
      // MATERIALES USADOS (si existen)
      // ========================================
      
      if (orden.materialesUsados) {
        doc.fontSize(14)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('MATERIALES UTILIZADOS', 50, yPos)

        yPos += 25

        doc.fontSize(10)
           .fillColor(COLORES.texto)
           .font('Helvetica')
           .text(orden.materialesUsados, 50, yPos, { width: 512 })

        yPos += Math.max(40, doc.heightOfString(orden.materialesUsados, { width: 512 }) + 20)
      }

      // ========================================
      // COSTOS (si existen)
      // ========================================
      
      if (orden.costoTotal || orden.costoManoObra || orden.costoMateriales) {
        doc.fontSize(14)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('COSTOS', 50, yPos)

        yPos += 25

        doc.fontSize(10)

        if (orden.costoManoObra) {
          doc.fillColor(COLORES.gris)
             .font('Helvetica')
             .text('Mano de Obra:', colIzq, yPos)
          
          doc.fillColor(COLORES.texto)
             .font('Helvetica-Bold')
             .text(`$${orden.costoManoObra.toLocaleString('es-CL')}`, colIzq + 100, yPos)

          yPos += 20
        }

        if (orden.costoMateriales) {
          doc.fillColor(COLORES.gris)
             .font('Helvetica')
             .text('Materiales:', colIzq, yPos)
          
          doc.fillColor(COLORES.texto)
             .font('Helvetica-Bold')
             .text(`$${orden.costoMateriales.toLocaleString('es-CL')}`, colIzq + 100, yPos)

          yPos += 20
        }

        if (orden.costoTotal) {
          doc.fillColor(COLORES.azul)
             .font('Helvetica-Bold')
             .text('TOTAL:', colIzq, yPos)
          
          doc.fillColor(COLORES.azulClaro)
             .fontSize(12)
             .text(`$${orden.costoTotal.toLocaleString('es-CL')}`, colIzq + 100, yPos)

          yPos += 30
        }
      }

      // ========================================
      // SECCIÓN DE FIRMAS
      // ========================================
      
      // Nueva página si no hay espacio suficiente
      if (yPos > 600) {
        doc.addPage()
        yPos = 50
      }

      yPos += 30

      // Línea divisoria antes de firmas
      doc.moveTo(50, yPos)
         .lineTo(562, yPos)
         .strokeColor(COLORES.linea)
         .lineWidth(1)
         .stroke()

      yPos += 30

      doc.fontSize(14)
         .fillColor(COLORES.azul)
         .font('Helvetica-Bold')
         .text('FIRMAS Y CONFORMIDAD', 50, yPos)

      yPos += 40

      // Dos columnas para firmas
      const firmaCol1 = 80
      const firmaCol2 = 350

      // FIRMA DEL TÉCNICO
      doc.fontSize(10)
         .fillColor(COLORES.gris)
         .font('Helvetica-Bold')
         .text('TÉCNICO', firmaCol1, yPos, { align: 'center', width: 150 })

      yPos += 15

      // Línea para firma
      doc.moveTo(firmaCol1, yPos + 50)
         .lineTo(firmaCol1 + 150, yPos + 50)
         .strokeColor(COLORES.gris)
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Firma del Técnico', firmaCol1, yPos + 60, { align: 'center', width: 150 })
      
      doc.text(orden.tecnico || 'Por asignar', firmaCol1, yPos + 75, { align: 'center', width: 150 })

      // FIRMA DEL CLIENTE
      doc.fontSize(10)
         .fillColor(COLORES.gris)
         .font('Helvetica-Bold')
         .text('CLIENTE', firmaCol2, yPos, { align: 'center', width: 150 })

      doc.moveTo(firmaCol2, yPos + 65)
         .lineTo(firmaCol2 + 150, yPos + 65)
         .strokeColor(COLORES.gris)
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Firma del Cliente', firmaCol2, yPos + 75, { align: 'center', width: 150 })
      
      doc.text(clienteDescifrado.nombre || 'Cliente', firmaCol2, yPos + 90, { align: 'center', width: 150 })

      yPos += 120

      // Texto de conformidad
      doc.fontSize(8)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text(
           'El cliente declara haber recibido el servicio conforme y autoriza el trabajo realizado.',
           50,
           yPos,
           { width: 512, align: 'center' }
         )

      // ========================================
      // PIE DE PÁGINA
      // ========================================
      
      const bottomY = 730

      doc.moveTo(50, bottomY)
         .lineTo(562, bottomY)
         .strokeColor(COLORES.linea)
         .lineWidth(1)
         .stroke()

      doc.fontSize(8)
         .fillColor(COLORES.gris)
         .font('Helvetica')
         .text(
           'KMTS POWER TECH - Climatización y Servicios | www.kmtspowertech.com',
           50,
           bottomY + 10,
           { width: 512, align: 'center' }
         )

      doc.text(
        `Documento generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`,
        50,
        bottomY + 22,
        { width: 512, align: 'center' }
      )

      doc.end()

    } catch (error) {
      console.error('❌ Error al generar PDF de orden de trabajo:', error)
      console.error('Stack:', error.stack)
      reject(error)
    }
  })
}

export default { generarPDFOrdenTrabajo }