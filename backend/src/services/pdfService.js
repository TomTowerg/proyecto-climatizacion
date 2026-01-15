import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF - DISEÑO MODERNO
 * Basado en plantilla corporativa con elementos gráficos
 */

/**
 * Dibujar curva decorativa azul
 */
const drawCurve = (doc, x, y, width, height, position = 'top-right') => {
  doc.save()
  
  if (position === 'top-right') {
    // Curva superior derecha
    doc
      .fillColor('#1e3a8a')
      .opacity(0.9)
      .moveTo(x + width - 150, y)
      .bezierCurveTo(
        x + width - 50, y + 50,
        x + width, y + 100,
        x + width, y + height
      )
      .lineTo(x + width, y)
      .fill()
    
    // Curva complementaria más clara
    doc
      .fillColor('#3b82f6')
      .opacity(0.6)
      .moveTo(x + width - 200, y)
      .bezierCurveTo(
        x + width - 100, y + 30,
        x + width - 50, y + 80,
        x + width, y + 120
      )
      .lineTo(x + width, y)
      .fill()
  } else {
    // Curva inferior derecha
    doc
      .fillColor('#1e3a8a')
      .opacity(0.9)
      .moveTo(x + width, y + height - 150)
      .bezierCurveTo(
        x + width - 50, y + height - 50,
        x + width - 100, y + height,
        x + width - 200, y + height
      )
      .lineTo(x + width, y + height)
      .fill()
    
    // Curva complementaria más clara
    doc
      .fillColor('#3b82f6')
      .opacity(0.6)
      .moveTo(x + width, y + height - 120)
      .bezierCurveTo(
        x + width - 30, y + height - 80,
        x + width - 80, y + height - 30,
        x + width - 180, y + height
      )
      .lineTo(x + width, y + height)
      .fill()
  }
  
  doc.restore()
}

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
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      })

      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // ======================
      // CURVA DECORATIVA SUPERIOR
      // ======================
      drawCurve(doc, 0, 0, 612, 150, 'top-right')

      // ======================
      // LOGO (simulado con ícono)
      // ======================
      doc
        .save()
        .fillColor('#1e3a8a')
        .opacity(1)
        // Rombo/diamante como logo
        .moveTo(60, 60)
        .lineTo(75, 50)
        .lineTo(90, 60)
        .lineTo(75, 70)
        .fill()
        .restore()

      // Nombre empresa junto al logo
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('KMTS Powertech', 95, 55)

      // ======================
      // TÍTULO PRINCIPAL
      // ======================
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Cotización de', 50, 110)
        .text('Servicios', 50, 140)

      // ======================
      // DATOS DEL CLIENTE Y EMISOR (DOS COLUMNAS)
      // ======================
      const dataY = 190

      // DATOS DEL CLIENTE (Izquierda)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('Datos del Cliente', 50, dataY)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text(cotizacion.cliente.nombre || 'Cliente', 50, dataY + 15)

      if (cotizacion.direccionInstalacion) {
        doc.text(cotizacion.direccionInstalacion, 50, dataY + 27, { width: 180 })
      }

      let clienteY = dataY + 39
      if (cotizacion.cliente.rut && cotizacion.cliente.rut !== 'null') {
        doc.text(`RUT: ${cotizacion.cliente.rut}`, 50, clienteY)
        clienteY += 12
      }
      if (cotizacion.cliente.telefono && cotizacion.cliente.telefono !== 'null') {
        doc.text(`Tel: ${cotizacion.cliente.telefono}`, 50, clienteY)
        clienteY += 12
      }
      if (cotizacion.cliente.email && cotizacion.cliente.email !== 'null') {
        doc.text(cotizacion.cliente.email, 50, clienteY, { width: 180 })
      }

      // DATOS DEL EMISOR (Derecha)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('Datos del Emisor', 320, dataY)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('KMTS Powertech SPA', 320, dataY + 15)
        .text('RUT: 78.163.187-6', 320, dataY + 27)
        .text('Tel: +56 9 5461 0454', 320, dataY + 39)
        .text('kmtspowertech@gmail.com', 320, dataY + 51)

      // Número y fecha de cotización
      doc
        .fontSize(7)
        .fillColor('#6b7280')
        .text(`N° ${cotizacion.id.toString().padStart(6, '0')}`, 320, dataY + 70)
        .text(`Fecha: ${new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}`, 320, dataY + 82)

      doc.moveDown(2)

      // ======================
      // TABLA DE PRODUCTOS/SERVICIOS
      // ======================
      const tableTop = 320
      const tableWidth = 532
      const colWidths = {
        producto: 260,
        cantidad: 70,
        precio: 90,
        subtotal: 112
      }

      // Encabezados con fondo azul
      doc
        .rect(40, tableTop, tableWidth, 25)
        .fillAndStroke('#1e3a8a', '#1e3a8a')

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('Producto', 50, tableTop + 8)
        .text('Cantidad', 310, tableTop + 8, { width: colWidths.cantidad, align: 'center' })
        .text('Precio', 380, tableTop + 8, { width: colWidths.precio, align: 'center' })
        .text('Subtotal', 470, tableTop + 8, { width: colWidths.subtotal, align: 'right' })

      let currentY = tableTop + 30

      // ======================
      // EQUIPO PRINCIPAL
      // ======================
      if (cotizacion.inventario) {
        // Borde de fila
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .rect(40, currentY - 5, tableWidth, 30)
          .stroke()

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(
            `${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`,
            50,
            currentY,
            { width: 240 }
          )
          .text('1', 310, currentY, { width: colWidths.cantidad, align: 'center' })
          .text(
            `$${cotizacion.precioOfertado.toLocaleString('es-CL')}`,
            380,
            currentY,
            { width: colWidths.precio, align: 'center' }
          )
          .text(
            `$${cotizacion.precioOfertado.toLocaleString('es-CL')}`,
            460,
            currentY,
            { width: colWidths.subtotal, align: 'right' }
          )

        // Detalles del equipo en línea secundaria
        doc
          .fontSize(7)
          .fillColor('#6b7280')
          .text(
            `${cotizacion.inventario.capacidadBTU} BTU - ${cotizacion.inventario.caracteristicas || 'Standard'}`,
            50,
            currentY + 12,
            { width: 240 }
          )

        currentY += 35
      }

      // ======================
      // INSTALACIÓN (si aplica)
      // ======================
      if (cotizacion.costoInstalacion > 0) {
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .rect(40, currentY - 5, tableWidth, 25)
          .stroke()

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text('Instalación', 50, currentY)
          .text('1', 310, currentY, { width: colWidths.cantidad, align: 'center' })
          .text(
            `$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`,
            380,
            currentY,
            { width: colWidths.precio, align: 'center' }
          )
          .text(
            `$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`,
            460,
            currentY,
            { width: colWidths.subtotal, align: 'right' }
          )

        currentY += 30
      }

      // ======================
      // MATERIALES
      // ======================
      if (cotizacion.materiales && cotizacion.materiales.length > 0) {
        cotizacion.materiales.forEach((material, index) => {
          // Verificar si necesitamos nueva página
          if (currentY > 680) {
            doc.addPage()
            currentY = 60
            
            // Repetir encabezados
            doc
              .rect(40, currentY, tableWidth, 25)
              .fillAndStroke('#1e3a8a', '#1e3a8a')
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Producto', 50, currentY + 8)
              .text('Cantidad', 310, currentY + 8, { width: colWidths.cantidad, align: 'center' })
              .text('Precio', 380, currentY + 8, { width: colWidths.precio, align: 'center' })
              .text('Subtotal', 470, currentY + 8, { width: colWidths.subtotal, align: 'right' })
            
            currentY += 30
          }

          doc
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .rect(40, currentY - 5, tableWidth, 25)
            .stroke()

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(material.nombre, 50, currentY, { width: 240 })
            .text(
              `${material.cantidad} ${material.unidad}`,
              310,
              currentY,
              { width: colWidths.cantidad, align: 'center' }
            )
            .text(
              `$${material.precioUnitario.toLocaleString('es-CL')}`,
              380,
              currentY,
              { width: colWidths.precio, align: 'center' }
            )
            .text(
              `$${material.subtotal.toLocaleString('es-CL')}`,
              460,
              currentY,
              { width: colWidths.subtotal, align: 'right' }
            )

          currentY += 30
        })
      }

      // ======================
      // TOTALES (Alineados a la derecha)
      // ======================
      currentY += 10

      const totalsX = 420
      const totalsValueX = 520

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Subtotal', totalsX, currentY)
        .text(
          `$${cotizacion.subtotal.toLocaleString('es-CL')}`,
          totalsValueX,
          currentY,
          { width: 52, align: 'right' }
        )

      currentY += 18

      // IVA (19%)
      const iva = cotizacion.precioFinal * 0.19
      doc
        .text('Impuestos (19%)', totalsX, currentY)
        .text(
          `$${Math.round(iva).toLocaleString('es-CL')}`,
          totalsValueX,
          currentY,
          { width: 52, align: 'right' }
        )

      currentY += 18

      // Descuento (si existe)
      if (cotizacion.descuento > 0) {
        const montoDescuento = cotizacion.subtotal - cotizacion.precioFinal
        doc
          .fillColor('#dc2626')
          .text(`Descuento (${cotizacion.descuento}%)`, totalsX, currentY)
          .text(
            `-$${montoDescuento.toLocaleString('es-CL')}`,
            totalsValueX,
            currentY,
            { width: 52, align: 'right' }
          )
          .fillColor('#374151')
        
        currentY += 18
      }

      // Línea divisora
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(totalsX, currentY)
        .lineTo(572, currentY)
        .stroke()

      currentY += 8

      // TOTAL
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('TOTAL', totalsX, currentY)
        .text(
          `$${cotizacion.precioFinal.toLocaleString('es-CL')}`,
          totalsValueX - 20,
          currentY,
          { width: 72, align: 'right' }
        )

      // ======================
      // CONDICIONES
      // ======================
      currentY += 40

      if (currentY > 620) {
        doc.addPage()
        currentY = 60
      }

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('CONDICIONES', 50, currentY)

      currentY += 15

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text(`• Forma de pago: Transferencia / Depósito`, 50, currentY)
        .text(`• Validez de la oferta: ${cotizacion.validez || 15} días naturales`, 50, currentY + 10)
        .text(`• Garantía del equipo: 1 año por defectos de fábrica`, 50, currentY + 20)
        .text(`• Tiempo estimado de entrega: 5 días hábiles a partir del pago`, 50, currentY + 30)
        .text(`• Incluye: Número de revisiones, formato de entrega`, 50, currentY + 40)

      // ======================
      // FOOTER CON DATOS DE CONTACTO
      // ======================
      const footerY = 710

      // Curva decorativa inferior
      drawCurve(doc, 0, 642, 612, 150, 'bottom-right')

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#ffffff')
        .text('📧 kmtspowertech@gmail.com', 420, footerY)
        .text('🌐 www.kmtspowertech.com', 420, footerY + 12)
        .text('📞 +56 9 5461 0454', 420, footerY + 24)

      // Atendido por
      if (cotizacion.agente) {
        doc
          .fontSize(7)
          .fillColor('#6b7280')
          .text(`Atendido por: ${cotizacion.agente}`, 50, footerY + 30)
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
        .text('ORDEN DE TRABAJO', { align: 'center' })
        .moveDown(0.5)
        .fontSize(12)
        .text(`OT #${ordenTrabajo.id.toString().padStart(6, '0')}`, { align: 'center' })
        .fontSize(10)
        .text(`Fecha: ${new Date(ordenTrabajo.createdAt || Date.now()).toLocaleDateString('es-CL')}`, { align: 'center' })
        .moveDown(1)

      // Tipo y estado
      doc
        .fontSize(14)
        .fillColor('#2563eb')
        .text(`TIPO: ${ordenTrabajo.tipo.toUpperCase()}`, { align: 'center' })
        .fillColor(ordenTrabajo.estado === 'pendiente' ? '#f59e0b' : '#10b981')
        .text(`Estado: ${ordenTrabajo.estado.toUpperCase()}`, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1)

      // Datos del cliente
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('CLIENTE:')
        .fontSize(10)
        .font('Helvetica')
        .text(`Nombre: ${ordenTrabajo.cliente.nombre}`)

      if (ordenTrabajo.direccion) {
        doc.text(`Dirección: ${ordenTrabajo.direccion}`)
      }
      
      if (ordenTrabajo.cliente.telefono && ordenTrabajo.cliente.telefono !== 'null') {
        doc.text(`Teléfono: ${ordenTrabajo.cliente.telefono}`)
      }

      doc.moveDown(1)

      // Datos del equipo
      if (ordenTrabajo.equipo) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('EQUIPO:')
          .fontSize(10)
          .font('Helvetica')
          .text(`Marca: ${ordenTrabajo.equipo.marca}`)
          .text(`Modelo: ${ordenTrabajo.equipo.modelo}`)
          .text(`Capacidad: ${ordenTrabajo.equipo.capacidad}`)
          .text(`N° Serie: ${ordenTrabajo.equipo.numeroSerie}`)
          .moveDown(1)
      }

      // Descripción
      if (ordenTrabajo.descripcion) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('DESCRIPCIÓN:')
          .fontSize(10)
          .font('Helvetica')
          .text(ordenTrabajo.descripcion, { align: 'justify' })
          .moveDown(1)
      }

      // Información adicional
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INFORMACIÓN ADICIONAL:')
        .fontSize(9)
        .font('Helvetica')

      if (ordenTrabajo.costoTotal) {
        doc.text(`Costo: $${ordenTrabajo.costoTotal.toLocaleString('es-CL')}`)
      }

      if (ordenTrabajo.tecnico) {
        doc.text(`Técnico: ${ordenTrabajo.tecnico.name}`)
      }

      // Firmas
      doc
        .moveDown(5)
        .fontSize(10)
        .text('_________________________', 100)
        .text('Firma Cliente', 100)
        .text('_________________________', 350)
        .text('Firma Técnico', 350)

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