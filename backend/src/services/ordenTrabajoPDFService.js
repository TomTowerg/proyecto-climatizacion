import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // ========================================
      // ENCABEZADO CON LOGO
      // ========================================
      
      // Buscar logo en múltiples ubicaciones
      const possibleLogoPaths = [
        path.join(__dirname, '../../public/logo-kmts.png'),
        path.resolve(__dirname, '../../../frontend/public/logo-kmts.png'),
        path.resolve(__dirname, '../../..', 'frontend', 'public', 'logo-kmts.png'),
      ]

      let logoPath = null
      for (const p of possibleLogoPaths) {
        if (fs.existsSync(p)) {
          logoPath = p
          console.log('✅ Logo encontrado en:', logoPath)
          break
        }
      }

      if (logoPath) {
        doc.image(logoPath, 50, 45, { width: 70, height: 70 })
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
      
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(new Date(orden.fecha).toLocaleDateString('es-CL'), colIzq + 100, yPos)

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Tipo de Servicio:', colDer, yPos)
      
      const tipoTexto = {
        instalacion: 'Instalación',
        mantenimiento: 'Mantenimiento',
        reparacion: 'Reparación'
      }[orden.tipo] || orden.tipo

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

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Urgencia:', colDer, yPos)
      
      const urgenciaColor = {
        baja: '#10B981',
        media: '#F59E0B',
        critica: '#EF4444'
      }[orden.urgencia] || COLORES.texto

      doc.fillColor(urgenciaColor)
         .font('Helvetica-Bold')
         .text((orden.urgencia || 'media').toUpperCase(), colDer + 100, yPos)

      yPos += 20

      doc.fillColor(COLORES.gris)
         .font('Helvetica')
         .text('Estado:', colIzq, yPos)
      
      const estadoColor = {
        pendiente: '#F59E0B',
        en_proceso: '#3B82F6',
        completado: '#10B981'
      }[orden.estado] || COLORES.texto

      const estadoTexto = {
        pendiente: 'Pendiente',
        en_proceso: 'En Proceso',
        completado: 'Completado'
      }[orden.estado] || orden.estado

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
         .text(orden.cliente.nombre, colIzq + 100, yPos)

      yPos += 20

      if (orden.cliente.rut) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('RUT:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.cliente.rut, colIzq + 100, yPos)

        yPos += 20
      }

      if (orden.cliente.telefono) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Teléfono:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.cliente.telefono, colIzq + 100, yPos)

        yPos += 20
      }

      if (orden.cliente.email) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Email:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica')
           .text(orden.cliente.email, colIzq + 100, yPos)

        yPos += 20
      }

      if (orden.cliente.direccion) {
        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Dirección:', colIzq, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica')
           .text(orden.cliente.direccion, colIzq + 100, yPos, { width: 400 })

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
           .text(orden.equipo.marca, colIzq + 100, yPos)

        doc.fillColor(COLORES.gris)
           .font('Helvetica')
           .text('Modelo:', colDer, yPos)
        
        doc.fillColor(COLORES.texto)
           .font('Helvetica-Bold')
           .text(orden.equipo.modelo, colDer + 100, yPos)

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
      // NOTAS
      // ========================================
      
      if (orden.notas) {
        doc.fontSize(14)
           .fillColor(COLORES.azul)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN DEL TRABAJO', 50, yPos)

        yPos += 25

        doc.fontSize(10)
           .fillColor(COLORES.texto)
           .font('Helvetica')
           .text(orden.notas, 50, yPos, { width: 512, align: 'justify' })

        yPos += Math.max(60, doc.heightOfString(orden.notas, { width: 512 }) + 20)
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
      
      doc.text(orden.cliente.nombre, firmaCol2, yPos + 90, { align: 'center', width: 150 })

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
      console.error('Error al generar PDF:', error)
      reject(error)
    }
  })
}

export default { generarPDFOrdenTrabajo }