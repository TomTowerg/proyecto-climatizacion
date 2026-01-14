import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF - VERSIÓN FINAL OPTIMIZADA
 * Layout compacto para caber todo en 1 página
 */

/**
 * GENERAR PDF DE COTIZACIÓN
 */
export const generarPDFCotizacion = async (cotizacion) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de cotizacion #${cotizacion.id}...`)

      // Crear directorio de PDFs si no existe
      const pdfDir = path.join(__dirname, '../../pdfs')
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true })
      }

      const fileName = `cotizacion-${cotizacion.id}-${Date.now()}.pdf`
      const filePath = path.join(pdfDir, fileName)

      // Crear documento PDF con márgenes reducidos
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 35, bottom: 35, left: 45, right: 45 }
      })

      // Pipe a archivo
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // ======================
      // ENCABEZADO MUY COMPACTO
      // ======================
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('COTIZACIÓN', { align: 'center' })
        .fillColor('#000000')
        .moveDown(0.2)

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`N° ${cotizacion.id.toString().padStart(6, '0')}`, { align: 'center' })
        .text(`Fecha: ${new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}`, { align: 'center' })
        .moveDown(0.4)

      // Línea separadora
      doc
        .strokeColor('#1e40af')
        .lineWidth(1.5)
        .moveTo(45, doc.y)
        .lineTo(567, doc.y)
        .stroke()
        .moveDown(0.5)

      // ======================
      // DATOS EMPRESA Y CLIENTE (MUY COMPACTOS)
      // ======================
      const yInfo = doc.y

      // EMPRESA (Izquierda)
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('KMTS POWERTECH SPA', 45, yInfo)
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#374151')
        .text('RUT: 78.163.187-6', 45)
        .text('Tel: +56 9 5461 0454', 45)
        .text('Email: kmtspowertech@gmail.com', 45)

      // CLIENTE (Derecha) - ⭐ MOSTRAR DATOS REALES
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CLIENTE:', 320, yInfo)

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#374151')
        .text(cotizacion.cliente.nombre || 'No especificado', 320)

      // Intentar mostrar datos - priorizar no cifrados
      if (cotizacion.cliente.rut && cotizacion.cliente.rut !== 'null') {
        doc.text(`RUT: ${cotizacion.cliente.rut}`, 320)
      }

      if (cotizacion.cliente.telefono && cotizacion.cliente.telefono !== 'null') {
        doc.text(`Tel: ${cotizacion.cliente.telefono}`, 320)
      }

      if (cotizacion.cliente.email && cotizacion.cliente.email !== 'null') {
        doc.text(`Email: ${cotizacion.cliente.email}`, 320, { width: 245, ellipsis: true })
      }

      // ⭐ DIRECCIÓN DE INSTALACIÓN
      if (cotizacion.direccionInstalacion) {
        doc
          .font('Helvetica-Bold')
          .text('Dirección instalación:', 320)
          .font('Helvetica')
          .text(cotizacion.direccionInstalacion, 320, { width: 245 })
      } else if (cotizacion.cliente.direccion && cotizacion.cliente.direccion !== 'null') {
        doc
          .font('Helvetica-Bold')
          .text('Dirección:', 320)
          .font('Helvetica')
          .text(cotizacion.cliente.direccion, 320, { width: 245 })
      }

      doc.moveDown(0.8)

      // ======================
      // TIPO DE SERVICIO + DETALLE DEL EQUIPO (LADO A LADO)
      // ======================
      const servicioY = doc.y

      // SERVICIO (Izquierda)
      doc
        .roundedRect(45, servicioY, 240, 20, 4)
        .fillAndStroke('#eff6ff', '#2563eb')
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(
          `SERVICIO: ${cotizacion.tipo.toUpperCase()}`,
          45,
          servicioY + 6,
          { width: 240, align: 'center' }
        )
        .fillColor('#000000')

      // DETALLE DEL EQUIPO (Derecha) - Solo si hay inventario
      if (cotizacion.inventario) {
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('DETALLE DEL EQUIPO', 320, servicioY)
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#374151')
          .text(`${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`, 320, servicioY + 12)
          .text(`${cotizacion.inventario.capacidadBTU} BTU - ${cotizacion.inventario.caracteristicas || 'Standard'}`, 320, servicioY + 22)
          .text(`Precio: $${cotizacion.precioOfertado.toLocaleString('es-CL')}`, 320, servicioY + 32)
      }

      doc.y = servicioY + 50

      // ======================
      // MATERIALES INCLUIDOS - COMPACTO
      // ======================
      if (cotizacion.materiales && cotizacion.materiales.length > 0) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('MATERIALES INCLUIDOS')
          .moveDown(0.2)

        const matTableTop = doc.y

        // Encabezados con fondo azul
        doc
          .rect(45, matTableTop, 522, 12)
          .fillAndStroke('#1e40af', '#1e40af')

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Material', 50, matTableTop + 3)
          .text('Cant.', 285, matTableTop + 3)
          .text('Unidad', 330, matTableTop + 3)
          .text('P. Unit.', 400, matTableTop + 3)
          .text('Subtotal', 490, matTableTop + 3)

        let currentY = matTableTop + 15

        // Filas de materiales (máximo espacio)
        cotizacion.materiales.forEach((material, index) => {
          // Fondo alternado
          if (index % 2 === 0) {
            doc
              .rect(45, currentY - 2, 522, 14)
              .fillAndStroke('#f9fafb', '#f9fafb')
          }

          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor('#000000')
            .text(material.nombre, 50, currentY, { width: 220, ellipsis: true })
            .text(material.cantidad.toString(), 285, currentY)
            .text(material.unidad, 330, currentY, { width: 60, ellipsis: true })
            .text(`$${material.precioUnitario.toLocaleString('es-CL')}`, 400, currentY)
            .text(`$${material.subtotal.toLocaleString('es-CL')}`, 470, currentY, {
              align: 'right',
              width: 90
            })

          currentY += 14
        })

        // Total de materiales
        doc
          .rect(350, currentY + 2, 217, 14)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('Total Materiales:', 355, currentY + 5)
          .text(
            `$${cotizacion.costoMaterial.toLocaleString('es-CL')}`,
            470,
            currentY + 5,
            { align: 'right', width: 90 }
          )
          .fillColor('#000000')

        doc.y = currentY + 20
      }

      // ======================
      // DESGLOSE DE COSTOS - A LA IZQUIERDA
      // ======================
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('DESGLOSE DE COSTOS')
        .moveDown(0.2)

      const costoTop = doc.y
      const labelCol = 45
      const valueCol = 230

      // Contenedor con borde
      const itemCount = 3 + 
                       (cotizacion.costoInstalacion > 0 ? 1 : 0) + 
                       (cotizacion.costoMaterial > 0 ? 1 : 0) + 
                       (cotizacion.descuento > 0 ? 1 : 0)
      
      const boxHeight = (itemCount * 12) + 35

      doc
        .roundedRect(45, costoTop, 250, boxHeight, 3)
        .stroke('#e5e7eb')

      let lineY = costoTop + 5

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Equipo:', labelCol + 5, lineY)
        .text(`$${cotizacion.precioOfertado.toLocaleString('es-CL')}`, valueCol, lineY, {
          align: 'right',
          width: 55
        })

      lineY += 12

      if (cotizacion.costoInstalacion > 0) {
        doc
          .text('Instalación:', labelCol + 5, lineY)
          .text(`$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 55
          })
        lineY += 12
      }

      if (cotizacion.costoMaterial > 0) {
        doc
          .text('Materiales:', labelCol + 5, lineY)
          .text(`$${cotizacion.costoMaterial.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 55
          })
        lineY += 12
      }

      // Línea divisora
      lineY += 3
      doc
        .strokeColor('#d1d5db')
        .lineWidth(0.5)
        .moveTo(labelCol + 5, lineY)
        .lineTo(285, lineY)
        .stroke()
      lineY += 5

      doc
        .font('Helvetica-Bold')
        .text('Subtotal:', labelCol + 5, lineY)
        .text(`$${cotizacion.subtotal.toLocaleString('es-CL')}`, valueCol, lineY, {
          align: 'right',
          width: 55
        })

      lineY += 12

      if (cotizacion.descuento > 0) {
        const montoDescuento = cotizacion.subtotal - cotizacion.precioFinal
        doc
          .fillColor('#dc2626')
          .font('Helvetica')
          .text(`Descuento (${cotizacion.descuento}%):`, labelCol + 5, lineY)
          .text(`-$${montoDescuento.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 55
          })
          .fillColor('#374151')
        lineY += 12
      }

      // Línea divisora gruesa
      lineY += 2
      doc
        .strokeColor('#1e40af')
        .lineWidth(1.5)
        .moveTo(labelCol + 5, lineY)
        .lineTo(285, lineY)
        .stroke()
      lineY += 6

      // TOTAL destacado
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('TOTAL:', labelCol + 5, lineY)
        .text(`$${cotizacion.precioFinal.toLocaleString('es-CL')}`, valueCol - 10, lineY, {
          align: 'right',
          width: 65
        })
        .fillColor('#000000')

      doc.y = costoTop + boxHeight + 10

      // ======================
      // OBSERVACIONES (si existen) - COMPACTO
      // ======================
      if (cotizacion.notas && cotizacion.notas.trim() !== '') {
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('OBSERVACIONES:')
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#374151')
          .text(cotizacion.notas, { align: 'justify', width: 522 })
          .moveDown(0.5)
      }

      // ======================
      // CONDICIONES GENERALES - HORIZONTAL COMPACTO
      // ======================
      const condicionesY = Math.max(doc.y, 690)

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('CONDICIONES GENERALES:', 45, condicionesY)

      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text(
          `• Validez: ${cotizacion.validez || 15} días  • Garantía equipo: 1 año  • Garantía instalación: 6 meses  • Pago: 50% inicial, 50% al finalizar  • Precios incluyen IVA`,
          45,
          condicionesY + 10,
          { width: 522, align: 'left' }
        )

      // ======================
      // PIE DE PÁGINA
      // ======================
      doc
        .fontSize(6)
        .font('Helvetica-Oblique')
        .fillColor('#9ca3af')
        .text(
          'Documento no vinculante. Requiere aprobación formal para proceder.',
          45,
          740,
          { align: 'center', width: 522 }
        )

      // Agente
      if (cotizacion.agente) {
        doc
          .fontSize(6)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Atendido por: ${cotizacion.agente}`, 45, 752)
      }

      // Finalizar PDF
      doc.end()

      // Esperar a que termine de escribirse
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

      const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } })
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
        .text(`Fecha programada: ${new Date(ordenTrabajo.fechaProgramada || Date.now()).toLocaleDateString('es-CL')}`, { align: 'center' })
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

      // Descripción del trabajo
      if (ordenTrabajo.descripcion) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('DESCRIPCIÓN DEL TRABAJO:')
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
        doc.text(`Costo estimado: $${ordenTrabajo.costoTotal.toLocaleString('es-CL')}`)
      }

      // Técnico asignado
      if (ordenTrabajo.tecnico) {
        doc.text(`Técnico asignado: ${ordenTrabajo.tecnico.name}`)
      }

      // Espacio para firma
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