import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF - VERSIÓN FINAL MEJORADA
 * Con logo, espaciado correcto y diseño optimizado
 */

/**
 * GENERAR PDF DE COTIZACIÓN
 */
export const generarPDFCotizacion = async (cotizacion) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de cotizacion #${cotizacion.id}...`)

      const pdfDir = path.join(__dirname, '../../pdfs')
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true })
      }

      const fileName = `cotizacion-${cotizacion.id}-${Date.now()}.pdf`
      const filePath = path.join(pdfDir, fileName)

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // ============================================
      // LOGO ARRIBA IZQUIERDA
      // ============================================
      const logoPath = path.join(__dirname, '../../public/logo-kmts.png')
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 80 })
        } else {
          // Si no existe, dibuja un placeholder
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#1e3a8a')
            .text('KMTS', 50, 50)
            .text('POWERTECH', 50, 62)
        }
      } catch (error) {
        console.log('Logo no encontrado, usando texto')
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('KMTS', 50, 50)
          .text('POWERTECH', 50, 62)
      }

      // ============================================
      // ENCABEZADO: COTIZACIÓN + FECHA + NÚMERO
      // ============================================
      doc
        .fontSize(26)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('COTIZACIÓN', 140, 55, { align: 'center', width: 332 })
        .moveDown(0.3)

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          `N° ${cotizacion.id.toString().padStart(6, '0')}  |  Fecha: ${new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}`,
          140,
          doc.y,
          { align: 'center', width: 332 }
        )

      // Línea separadora
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(50, 100)
        .lineTo(562, 100)
        .stroke()

      // ============================================
      // EMPRESA (Izquierda) y CLIENTE (Derecha)
      // ============================================
      const dataY = 115

      // EMPRESA (Izquierda)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DATOS DE LA EMPRESA', 50, dataY)

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('KMTS POWERTECH SPA', 50, dataY + 15)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('RUT: 78.163.187-6', 50, dataY + 28)
        .text('Teléfono: +56 9 5461 0454', 50, dataY + 40)
        .text('Email: kmtspowertech@gmail.com', 50, dataY + 52)

      // CLIENTE (Derecha)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DATOS DEL CLIENTE', 320, dataY)

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text(cotizacion.cliente.nombre || 'Cliente', 320, dataY + 15)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')

      let clienteY = dataY + 28
      if (cotizacion.cliente.telefono && cotizacion.cliente.telefono !== 'null') {
        doc.text(`Teléfono: ${cotizacion.cliente.telefono}`, 320, clienteY)
        clienteY += 12
      }
      if (cotizacion.cliente.email && cotizacion.cliente.email !== 'null') {
        doc.text(`Email: ${cotizacion.cliente.email}`, 320, clienteY, { width: 230 })
      }

      // ============================================
      // DIRECCIÓN DEL SERVICIO (Más abajo, sin sobreponerse)
      // ============================================
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DIRECCIÓN DEL SERVICIO', 50, dataY + 75)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          cotizacion.direccionInstalacion || cotizacion.cliente.direccion || 'No especificada',
          50,
          dataY + 90,
          { width: 500 }
        )

      // ============================================
      // TIPO DE SERVICIO (Solo texto simple)
      // ============================================
      const tipoTexto = {
        instalacion: 'INSTALACIÓN',
        mantencion: 'MANTENCIÓN',
        reparacion: 'REPARACIÓN'
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('TIPO DE SERVICIO', 50, dataY + 110)
        .fontSize(9)
        .fillColor('#1f2937')
        .text(tipoTexto[cotizacion.tipo] || 'SERVICIO', 50, dataY + 125)

      // ============================================
      // DETALLE DEL EQUIPO
      // ============================================
      let equipoY = dataY + 150

      if (cotizacion.inventario) {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('DETALLE DEL EQUIPO', 50, equipoY)

        equipoY += 18

        // Fondo gris claro para la tabla
        doc
          .rect(50, equipoY, 512, 65)
          .fillAndStroke('#f9fafb', '#e5e7eb')

        // Contenido del equipo
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text(`${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`, 60, equipoY + 8)
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`Capacidad: ${cotizacion.inventario.capacidadBTU} BTU`, 60, equipoY + 25)
          .text(`Características: ${cotizacion.inventario.caracteristicas || 'Standard'}`, 60, equipoY + 39)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text(
            `Precio: $${cotizacion.precioOfertado.toLocaleString('es-CL')}`,
            410,
            equipoY + 25,
            { align: 'right', width: 140 }
          )

        equipoY += 75
      }

      // ============================================
      // MATERIALES INCLUIDOS
      // ============================================
      if (cotizacion.materiales && cotizacion.materiales.length > 0) {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('MATERIALES INCLUIDOS', 50, equipoY)

        equipoY += 18

        const matTableTop = equipoY

        // Encabezados con fondo azul
        doc
          .rect(50, matTableTop, 512, 20)
          .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Material', 60, matTableTop + 6)
          .text('Cantidad', 290, matTableTop + 6)
          .text('Precio Unit.', 370, matTableTop + 6)
          .text('Subtotal', 480, matTableTop + 6)

        let currentY = matTableTop + 25

        // Filas de materiales
        cotizacion.materiales.forEach((material, index) => {
          // Verificar espacio para nueva página
          if (currentY > 650) {
            doc.addPage()
            currentY = 60

            // Repetir encabezados
            doc
              .rect(50, currentY, 512, 20)
              .fillAndStroke('#1e3a8a', '#1e3a8a')
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Material', 60, currentY + 6)
              .text('Cantidad', 290, currentY + 6)
              .text('Precio Unit.', 370, currentY + 6)
              .text('Subtotal', 480, currentY + 6)

            currentY += 25
          }

          // Fondo alternado
          if (index % 2 === 0) {
            doc
              .rect(50, currentY - 3, 512, 18)
              .fillAndStroke('#f9fafb', '#f9fafb')
          }

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(material.nombre, 60, currentY, { width: 210 })
            .text(`${material.cantidad} ${material.unidad}`, 290, currentY)
            .text(`$${material.precioUnitario.toLocaleString('es-CL')}`, 370, currentY)
            .text(`$${material.subtotal.toLocaleString('es-CL')}`, 480, currentY)

          currentY += 18
        })

        // Total de materiales con fondo
        doc
          .rect(380, currentY + 5, 182, 18)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('Total Materiales:', 390, currentY + 10)
          .text(`$${cotizacion.costoMaterial.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35
      }

      // ============================================
      // CONDICIONES (Izquierda) y DESGLOSE (Derecha)
      // ============================================
      const bottomSectionY = equipoY + 10

      // Verificar si necesitamos nueva página
      if (bottomSectionY > 560) {
        doc.addPage()
        equipoY = 60
      }

      // CONDICIONES GENERALES (Izquierda)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('CONDICIONES GENERALES', 50, bottomSectionY)

      const condicionesY = bottomSectionY + 18

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#374151')
        .text('• Forma de pago: 50% al aprobar, 50% al finalizar', 50, condicionesY, { width: 240 })
        .text(`• Validez de la oferta: ${cotizacion.validez || 15} días`, 50, condicionesY + 12, { width: 240 })
        .text('• Garantía del equipo: 1 año por defectos de fábrica', 50, condicionesY + 24, { width: 240 })
        .text('• Garantía de instalación: 6 meses', 50, condicionesY + 36, { width: 240 })
        .text('• Los precios incluyen IVA', 50, condicionesY + 48, { width: 240 })

      // DESGLOSE DE COSTOS (Derecha) - ⭐ CAJA MÁS GRANDE
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DESGLOSE DE COSTOS', 320, bottomSectionY)

      const desgloseY = bottomSectionY + 18
      
      // ⭐ Calcular altura necesaria (más grande para que quepa TOTAL)
      const desgloseHeight = 
        25 + // Equipo
        (cotizacion.costoInstalacion > 0 ? 15 : 0) +
        (cotizacion.costoMaterial > 0 ? 15 : 0) +
        15 + // Subtotal
        (cotizacion.descuento > 0 ? 15 : 0) +
        35  // ⭐ Espacio para TOTAL (aumentado de 25 a 35)

      // Fondo para el desglose
      doc
        .rect(320, desgloseY, 242, desgloseHeight)
        .fillAndStroke('#ffffff', '#e5e7eb')

      let lineY = desgloseY + 10

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Equipo:', 330, lineY)
        .text(`$${cotizacion.precioOfertado.toLocaleString('es-CL')}`, 480, lineY, {
          align: 'right',
          width: 70
        })

      lineY += 15

      if (cotizacion.costoInstalacion > 0) {
        doc
          .text('Instalación:', 330, lineY)
          .text(`$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`, 480, lineY, {
            align: 'right',
            width: 70
          })
        lineY += 15
      }

      if (cotizacion.costoMaterial > 0) {
        doc
          .text('Materiales:', 330, lineY)
          .text(`$${cotizacion.costoMaterial.toLocaleString('es-CL')}`, 480, lineY, {
            align: 'right',
            width: 70
          })
        lineY += 15
      }

      // Línea divisora
      lineY += 5
      doc
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .moveTo(330, lineY)
        .lineTo(552, lineY)
        .stroke()
      lineY += 8

      doc
        .font('Helvetica-Bold')
        .text('Subtotal:', 330, lineY)
        .text(`$${cotizacion.subtotal.toLocaleString('es-CL')}`, 480, lineY, {
          align: 'right',
          width: 70
        })

      lineY += 15

      if (cotizacion.descuento > 0) {
        const montoDescuento = cotizacion.subtotal - cotizacion.precioFinal
        doc
          .fillColor('#dc2626')
          .font('Helvetica')
          .text(`Descuento (${cotizacion.descuento}%):`, 330, lineY)
          .text(`-$${montoDescuento.toLocaleString('es-CL')}`, 480, lineY, {
            align: 'right',
            width: 70
          })
          .fillColor('#374151')
        lineY += 15
      }

      // Línea divisora gruesa
      lineY += 5
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(330, lineY)
        .lineTo(552, lineY)
        .stroke()
      lineY += 10

      // TOTAL (ahora sí cabe dentro de la caja)
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('TOTAL:', 330, lineY)
        .text(`$${cotizacion.precioFinal.toLocaleString('es-CL')}`, 450, lineY, {
          align: 'right',
          width: 100
        })

      // ============================================
      // PIE DE PÁGINA
      // ============================================
      const footerY = 720

      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .fillColor('#6b7280')
        .text(
          'Este documento es una cotización no vinculante. Para proceder con el servicio es necesaria la aprobación formal.',
          50,
          footerY,
          { align: 'center', width: 512 }
        )

      // Atendido por
      if (cotizacion.agente) {
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`Atendido por: ${cotizacion.agente}`, 50, footerY + 15, { align: 'center', width: 512 })
      }

      // Finalizar PDF
      doc.end()

      stream.on('finish', () => {
        console.log(`✅ PDF generado: ${fileName}`)
        resolve({
          success: true,
          fileName,
          filePath,
          url: `/pdfs/${fileName}`
        })
      })

      stream.on('error', (error) => {
        console.error('❌ Error al escribir PDF:', error)
        reject(error)
      })
    } catch (error) {
      console.error('❌ Error al generar PDF:', error)
      reject(error)
    }
  })
}

/**
 * GENERAR PDF DE ORDEN DE TRABAJO
 */
export const generarPDFOrdenTrabajo = async (ordenTrabajo) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de orden de trabajo #${ordenTrabajo.id}...`)

      const pdfDir = path.join(__dirname, '../../pdfs')
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true })
      }

      const fileName = `orden-trabajo-${ordenTrabajo.id}-${Date.now()}.pdf`
      const filePath = path.join(pdfDir, fileName)

      const doc = new PDFDocument({ 
        size: 'LETTER', 
        margins: { top: 50, bottom: 50, left: 50, right: 50 } 
      })
      
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // Encabezado
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('ORDEN DE TRABAJO', { align: 'center' })
        .moveDown(0.3)
        .fontSize(10)
        .fillColor('#374151')
        .text(`OT N° ${ordenTrabajo.id.toString().padStart(6, '0')}`, { align: 'center' })
        .text(`Fecha: ${new Date(ordenTrabajo.createdAt || Date.now()).toLocaleDateString('es-CL')}`, { align: 'center' })
        .moveDown(1)

      // Línea separadora
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(1)

      // Tipo y estado
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text(`TIPO: ${ordenTrabajo.tipo.toUpperCase()}`, { align: 'center' })
        .fillColor(ordenTrabajo.estado === 'pendiente' ? '#f59e0b' : '#10b981')
        .text(`Estado: ${ordenTrabajo.estado.toUpperCase()}`, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1)

      // Cliente
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('CLIENTE:', 50)
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text(ordenTrabajo.cliente.nombre, 50)

      if (ordenTrabajo.direccion) {
        doc.text(`Dirección: ${ordenTrabajo.direccion}`, 50)
      }
      
      if (ordenTrabajo.cliente.telefono && ordenTrabajo.cliente.telefono !== 'null') {
        doc.text(`Tel: ${ordenTrabajo.cliente.telefono}`, 50)
      }

      doc.moveDown(1)

      // Equipo
      if (ordenTrabajo.equipo) {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('EQUIPO:', 50)
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`${ordenTrabajo.equipo.marca} ${ordenTrabajo.equipo.modelo}`, 50)
          .text(`Capacidad: ${ordenTrabajo.equipo.capacidad}`, 50)
          .text(`N° Serie: ${ordenTrabajo.equipo.numeroSerie}`, 50)
          .moveDown(1)
      }

      // Descripción
      if (ordenTrabajo.descripcion) {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('DESCRIPCIÓN:', 50)
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#374151')
          .text(ordenTrabajo.descripcion, 50, doc.y, { align: 'justify', width: 512 })
          .moveDown(1)
      }

      // Información adicional
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('INFORMACIÓN:', 50)
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')

      if (ordenTrabajo.costoTotal) {
        doc.text(`Costo: $${ordenTrabajo.costoTotal.toLocaleString('es-CL')}`, 50)
      }

      if (ordenTrabajo.tecnico) {
        doc.text(`Técnico: ${ordenTrabajo.tecnico.name}`, 50)
      }

      // Firmas
      doc
        .moveDown(4)
        .fontSize(9)
        .text('_________________________', 100)
        .text('Firma Cliente', 100, doc.y + 5)
        .text('_________________________', 350, doc.y - 17)
        .text('Firma Técnico', 350, doc.y + 5)

      doc.end()

      stream.on('finish', () => {
        console.log(`✅ PDF de OT generado: ${fileName}`)
        resolve({
          success: true,
          fileName,
          filePath,
          url: `/pdfs/${fileName}`
        })
      })

      stream.on('error', reject)
    } catch (error) {
      console.error('❌ Error al generar PDF de OT:', error)
      reject(error)
    }
  })
}

export default {
  generarPDFCotizacion,
  generarPDFOrdenTrabajo
}
