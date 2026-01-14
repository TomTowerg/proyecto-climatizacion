import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF MEJORADO
 * Versión optimizada con mejor diseño y manejo de espacio
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

      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 50, right: 50 }
      })

      // Pipe a archivo
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // ======================
      // ENCABEZADO COMPACTO
      // ======================
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('COTIZACIÓN', { align: 'center' })
        .fillColor('#000000')
        .moveDown(0.3)

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`N° ${cotizacion.id.toString().padStart(6, '0')}`, { align: 'center' })
        .text(`Fecha: ${new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}`, { align: 'center' })
        .moveDown(0.5)

      // Línea separadora
      doc
        .strokeColor('#1e40af')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(0.8)

      // ======================
      // DATOS EMPRESA Y CLIENTE (LADO A LADO COMPACTO)
      // ======================
      const yInfo = doc.y

      // EMPRESA (Izquierda)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('KMTS POWERTECH SPA', 50, yInfo)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('RUT: 78.163.187-6', 50)
        .text('Teléfono: +56 9 5461 0454', 50)
        .text('Email: kmtspowertech@gmail.com', 50)

      // CLIENTE (Derecha) - ⭐ MANEJAR DATOS CIFRADOS
      const clienteRut = cotizacion.cliente.rut || cotizacion.cliente.rut_encrypted || 'No especificado'
      const clienteTelefono = cotizacion.cliente.telefono || cotizacion.cliente.telefono_encrypted || 'No especificado'
      const clienteEmail = cotizacion.cliente.email || cotizacion.cliente.email_encrypted || 'No especificado'

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CLIENTE:', 350, yInfo)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text(cotizacion.cliente.nombre, 350)
      
      if (clienteRut !== 'No especificado') {
        doc.text(`RUT: ${clienteRut}`, 350)
      }
      if (clienteTelefono !== 'No especificado') {
        doc.text(`Tel: ${clienteTelefono}`, 350)
      }
      if (clienteEmail !== 'No especificado') {
        doc.text(`Email: ${clienteEmail}`, 350)
      }

      doc.moveDown(1.5)

      // ======================
      // TIPO DE SERVICIO - BADGE
      // ======================
      const tipoBadgeY = doc.y
      doc
        .roundedRect(200, tipoBadgeY, 210, 25, 5)
        .fillAndStroke('#eff6ff', '#2563eb')
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(
          `SERVICIO: ${cotizacion.tipo.toUpperCase()}`,
          200,
          tipoBadgeY + 7,
          { width: 210, align: 'center' }
        )
        .fillColor('#000000')

      doc.y = tipoBadgeY + 35

      // ======================
      // DETALLE DEL EQUIPO - COMPACTO
      // ======================
      if (cotizacion.inventario) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('DETALLE DEL EQUIPO')
          .moveDown(0.3)

        // Fondo gris para la tabla
        const tableTop = doc.y
        doc
          .rect(50, tableTop, 512, 60)
          .fillAndStroke('#f9fafb', '#e5e7eb')

        // Contenido de la tabla
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#6b7280')
          .text('Descripción', 55, tableTop + 5)
          .text('Capacidad', 250, tableTop + 5)
          .text('Características', 350, tableTop + 5)
          .text('Precio', 495, tableTop + 5)

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(
            `${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`,
            55,
            tableTop + 20,
            { width: 180 }
          )
          .text(`${cotizacion.inventario.capacidadBTU} BTU`, 250, tableTop + 20)
          .text(cotizacion.inventario.caracteristicas || 'Standard', 350, tableTop + 20, { width: 120 })
          .text(
            `$${cotizacion.precioOfertado.toLocaleString('es-CL')}`,
            460,
            tableTop + 20,
            { align: 'right', width: 95 }
          )

        doc.y = tableTop + 70
      }

      // ======================
      // MATERIALES INCLUIDOS - OPTIMIZADO
      // ======================
      if (cotizacion.materiales && cotizacion.materiales.length > 0) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('MATERIALES INCLUIDOS')
          .moveDown(0.3)

        const matTableTop = doc.y

        // Encabezados con fondo
        doc
          .rect(50, matTableTop, 512, 15)
          .fillAndStroke('#1e40af', '#1e40af')

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Material', 55, matTableTop + 3)
          .text('Cant.', 280, matTableTop + 3)
          .text('Unidad', 330, matTableTop + 3)
          .text('P. Unit.', 400, matTableTop + 3)
          .text('Subtotal', 490, matTableTop + 3)

        let currentY = matTableTop + 20

        // ⭐ CONTROL DE PAGINACIÓN MEJORADO
        cotizacion.materiales.forEach((material, index) => {
          // Si no hay espacio, agregar nueva página
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            // Repetir encabezados en nueva página
            doc
              .rect(50, currentY - 15, 512, 15)
              .fillAndStroke('#1e40af', '#1e40af')
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Material', 55, currentY - 12)
              .text('Cant.', 280, currentY - 12)
              .text('Unidad', 330, currentY - 12)
              .text('P. Unit.', 400, currentY - 12)
              .text('Subtotal', 490, currentY - 12)
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
            .fillColor('#000000')
            .text(material.nombre, 55, currentY, { width: 210, ellipsis: true })
            .text(material.cantidad.toString(), 280, currentY)
            .text(material.unidad, 330, currentY)
            .text(`$${material.precioUnitario.toLocaleString('es-CL')}`, 400, currentY)
            .text(`$${material.subtotal.toLocaleString('es-CL')}`, 460, currentY, {
              align: 'right',
              width: 95
            })

          currentY += 18
        })

        // Total de materiales con fondo
        doc
          .rect(350, currentY + 5, 212, 18)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('Total Materiales:', 355, currentY + 9)
          .text(
            `$${cotizacion.costoMaterial.toLocaleString('es-CL')}`,
            460,
            currentY + 9,
            { align: 'right', width: 95 }
          )
          .fillColor('#000000')

        doc.y = currentY + 30
      }

      // ======================
      // DESGLOSE DE COSTOS
      // ======================
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('DESGLOSE DE COSTOS')
        .moveDown(0.3)

      const costoTop = doc.y
      const labelCol = 380
      const valueCol = 490

      // Fondo para desglose
      const desgloseHeight = (cotizacion.costoInstalacion > 0 ? 15 : 0) + 
                             (cotizacion.costoMaterial > 0 ? 15 : 0) + 
                             (cotizacion.descuento > 0 ? 15 : 0) + 60

      doc
        .rect(370, costoTop, 192, desgloseHeight)
        .fillAndStroke('#ffffff', '#e5e7eb')

      let lineY = costoTop + 5

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Equipo:', labelCol, lineY)
        .text(`$${cotizacion.precioOfertado.toLocaleString('es-CL')}`, valueCol, lineY, {
          align: 'right',
          width: 65
        })

      lineY += 15

      if (cotizacion.costoInstalacion > 0) {
        doc
          .text('Instalación:', labelCol, lineY)
          .text(`$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 65
          })
        lineY += 15
      }

      if (cotizacion.costoMaterial > 0) {
        doc
          .text('Materiales:', labelCol, lineY)
          .text(`$${cotizacion.costoMaterial.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 65
          })
        lineY += 15
      }

      // Línea divisora
      lineY += 3
      doc
        .strokeColor('#d1d5db')
        .lineWidth(1)
        .moveTo(380, lineY)
        .lineTo(555, lineY)
        .stroke()
      lineY += 8

      doc
        .font('Helvetica-Bold')
        .text('Subtotal:', labelCol, lineY)
        .text(`$${cotizacion.subtotal.toLocaleString('es-CL')}`, valueCol, lineY, {
          align: 'right',
          width: 65
        })

      lineY += 15

      if (cotizacion.descuento > 0) {
        const montoDescuento = cotizacion.subtotal - cotizacion.precioFinal
        doc
          .fillColor('#dc2626')
          .font('Helvetica')
          .text(`Descuento (${cotizacion.descuento}%):`, labelCol, lineY)
          .text(`-$${montoDescuento.toLocaleString('es-CL')}`, valueCol, lineY, {
            align: 'right',
            width: 65
          })
          .fillColor('#374151')
        lineY += 15
      }

      // Línea divisora gruesa
      lineY += 3
      doc
        .strokeColor('#1e40af')
        .lineWidth(2)
        .moveTo(380, lineY)
        .lineTo(555, lineY)
        .stroke()
      lineY += 8

      // TOTAL destacado
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('TOTAL:', labelCol, lineY)
        .text(`$${cotizacion.precioFinal.toLocaleString('es-CL')}`, valueCol - 10, lineY, {
          align: 'right',
          width: 75
        })
        .fillColor('#000000')

      doc.y = costoTop + desgloseHeight + 20

      // ======================
      // OBSERVACIONES (si existen)
      // ======================
      if (cotizacion.notas && cotizacion.notas.trim() !== '') {
        // Verificar espacio para observaciones
        if (doc.y > 650) {
          doc.addPage()
        }

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text('OBSERVACIONES:')
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#374151')
          .text(cotizacion.notas, { align: 'justify' })
          .moveDown(1)
      }

      // ======================
      // CONDICIONES GENERALES - HORIZONTAL
      // ======================
      // Ir al final de la página
      const condicionesY = 680

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('CONDICIONES GENERALES:', 50, condicionesY)

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#4b5563')
        .text(
          `• Validez: ${cotizacion.validez || 15} días  • Garantía equipo: 1 año  • Garantía instalación: 6 meses  • Pago: 50% inicial, 50% al finalizar  • Precios incluyen IVA`,
          50,
          condicionesY + 12,
          { width: 512, align: 'left', lineGap: 2 }
        )

      // ======================
      // PIE DE PÁGINA
      // ======================
      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .fillColor('#9ca3af')
        .text(
          'Documento no vinculante. Requiere aprobación formal para proceder.',
          50,
          735,
          { align: 'center', width: 512 }
        )

      // Agente
      if (cotizacion.agente) {
        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Atendido por: ${cotizacion.agente}`, 50, 750)
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
        .text(`Fecha programada: ${new Date(ordenTrabajo.fechaProgramada).toLocaleDateString('es-CL')}`, { align: 'center' })
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
        .text(`Dirección: ${ordenTrabajo.direccion}`)
        .text(`Teléfono: ${ordenTrabajo.cliente.telefono || 'No especificado'}`)
        .moveDown(1)

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
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('DESCRIPCIÓN DEL TRABAJO:')
        .fontSize(10)
        .font('Helvetica')
        .text(ordenTrabajo.descripcion, { align: 'justify' })
        .moveDown(1)

      // Información adicional
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INFORMACIÓN ADICIONAL:')
        .fontSize(9)
        .font('Helvetica')
        .text(`Costo estimado: $${ordenTrabajo.costoTotal?.toLocaleString('es-CL') || '0'}`)

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