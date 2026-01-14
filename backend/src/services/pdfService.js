import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF
 * Crea cotizaciones profesionales en formato PDF
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
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      // Pipe a archivo
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // ======================
      // ENCABEZADO
      // ======================
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('COTIZACIÓN', { align: 'center' })
        .moveDown(0.5)

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`N° ${cotizacion.id.toString().padStart(6, '0')}`, { align: 'center' })
        .text(`Fecha: ${new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}`, { align: 'center' })
        .moveDown(1)

      // Línea separadora
      doc
        .strokeColor('#333333')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(1)

      // ======================
      // DATOS EMPRESA
      // ======================
      const yEmpresa = doc.y
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('KMTS POWERTECH SPA', 50, yEmpresa)
        .fontSize(9)
        .font('Helvetica')
        .text('RUT: 78.163.187-6', 50)
        .text('Teléfono: +56 9 54610454', 50)
        .text('Email: kmtspowertech@gmail.com', 50)

      // ======================
      // DATOS CLIENTE - ⭐ AJUSTADO
      // ======================
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('CLIENTE:', 350, yEmpresa)
        .fontSize(9)
        .font('Helvetica')
        .text(cotizacion.cliente.nombre, 350)
      
      // ⭐ Mostrar solo si no son null
      if (cotizacion.cliente.rut && cotizacion.cliente.rut !== 'null') {
        doc.text(`RUT: ${cotizacion.cliente.rut}`, 350)
      }
      if (cotizacion.cliente.telefono && cotizacion.cliente.telefono !== 'null') {
        doc.text(`Teléfono: ${cotizacion.cliente.telefono}`, 350)
      }
      if (cotizacion.cliente.email && cotizacion.cliente.email !== 'null') {
        doc.text(`Email: ${cotizacion.cliente.email}`, 350)
      }
      
      // ⭐ Agregar dirección de instalación si existe
      if (cotizacion.direccionInstalacion) {
        doc.text(`Dirección: ${cotizacion.direccionInstalacion}`, 350, { width: 210 })
      }

      doc.moveDown(2)

      // ======================
      // TIPO DE SERVICIO
      // ======================
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text(`TIPO DE SERVICIO: ${cotizacion.tipo.toUpperCase()}`, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1)

      // ======================
      // DETALLE DEL EQUIPO
      // ======================
      if (cotizacion.inventario) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('DETALLE DEL EQUIPO')
          .moveDown(0.5)

        // Tabla de equipo
        const tableTop = doc.y
        const col1 = 50
        const col2 = 200
        const col3 = 350
        const col4 = 480

        // Encabezados de tabla
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#666666')
          .text('Descripción', col1, tableTop)
          .text('Capacidad', col2, tableTop)
          .text('Características', col3, tableTop)
          .text('Precio', col4, tableTop)

        // Línea bajo encabezados
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, tableTop + 15)
          .lineTo(562, tableTop + 15)
          .stroke()

        // Datos del producto
        const rowTop = tableTop + 25
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(
            `${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`,
            col1,
            rowTop,
            { width: 140 }
          )
          .text(`${cotizacion.inventario.capacidadBTU} BTU`, col2, rowTop)
          .text(cotizacion.inventario.caracteristicas || 'N/A', col3, rowTop, { width: 120 })
          .text(
            `$${cotizacion.precioOfertado.toLocaleString('es-CL')}`,
            col4,
            rowTop,
            { align: 'right', width: 80 }
          )

        doc.moveDown(3)
      }

      // ⭐ ======================
      // ⭐ MATERIALES INCLUIDOS
      // ⭐ ======================
      if (cotizacion.materiales && cotizacion.materiales.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('MATERIALES INCLUIDOS')
          .moveDown(0.5)

        // Encabezados de tabla de materiales
        const materialesTableTop = doc.y
        const matCol1 = 50   // Material
        const matCol2 = 250  // Cantidad
        const matCol3 = 330  // Unidad
        const matCol4 = 400  // Precio Unit.
        const matCol5 = 480  // Subtotal

        // Encabezados
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#666666')
          .text('Material', matCol1, materialesTableTop)
          .text('Cantidad', matCol2, materialesTableTop)
          .text('Unidad', matCol3, materialesTableTop)
          .text('Precio Unit.', matCol4, materialesTableTop)
          .text('Subtotal', matCol5, materialesTableTop)

        // Línea bajo encabezados
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, materialesTableTop + 15)
          .lineTo(562, materialesTableTop + 15)
          .stroke()

        // Filas de materiales
        let currentY = materialesTableTop + 25
        
        cotizacion.materiales.forEach((material, index) => {
          // Alternar color de fondo para mejor lectura
          if (index % 2 === 0) {
            doc
              .fillColor('#f9fafb')
              .rect(50, currentY - 5, 512, 20)
              .fill()
          }

          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(
              material.nombre,
              matCol1,
              currentY,
              { width: 190 }
            )
            .text(
              material.cantidad.toString(),
              matCol2,
              currentY
            )
            .text(
              material.unidad,
              matCol3,
              currentY
            )
            .text(
              `$${material.precioUnitario.toLocaleString('es-CL')}`,
              matCol4,
              currentY
            )
            .text(
              `$${material.subtotal.toLocaleString('es-CL')}`,
              matCol5,
              currentY,
              { align: 'right', width: 80 }
            )

          currentY += 25
          
          // Si llegamos al final de la página, agregar nueva página
          if (currentY > 700) {
            doc.addPage()
            currentY = 50
          }
        })

        // Total de materiales
        doc
          .moveDown(0.5)
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Total Materiales:', 350, currentY + 10)
          .text(
            `$${cotizacion.costoMaterial.toLocaleString('es-CL')}`,
            480,
            currentY + 10,
            { align: 'right', width: 80 }
          )

        doc.moveDown(2)
      }
      
      // ======================
      // DESGLOSE DE COSTOS
      // ======================
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('DESGLOSE DE COSTOS')
        .moveDown(0.5)

      const costoTop = doc.y
      const labelCol = 50
      const valueCol = 480

      // Subtotales
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Equipo:', labelCol, costoTop)
        .text(`$${cotizacion.precioOfertado.toLocaleString('es-CL')}`, valueCol, costoTop, {
          align: 'right',
          width: 80
        })

      if (cotizacion.costoInstalacion > 0) {
        doc
          .text('Instalación:', labelCol)
          .text(`$${cotizacion.costoInstalacion.toLocaleString('es-CL')}`, valueCol, doc.y - 12, {
            align: 'right',
            width: 80
          })
      }

      if (cotizacion.costoMaterial > 0) {
        doc
          .text('Materiales:', labelCol)
          .text(`$${cotizacion.costoMaterial.toLocaleString('es-CL')}`, valueCol, doc.y - 12, {
            align: 'right',
            width: 80
          })
      }

      // Subtotal
      doc
        .moveDown(0.5)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(350, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(0.3)

      doc
        .font('Helvetica')
        .text('Subtotal:', labelCol)
        .text(`$${cotizacion.subtotal.toLocaleString('es-CL')}`, valueCol, doc.y - 12, {
          align: 'right',
          width: 80
        })

      // Descuento
      if (cotizacion.descuento > 0) {
        const montoDescuento = cotizacion.subtotal - cotizacion.precioFinal
        doc
          .fillColor('#dc2626')
          .text(`Descuento (${cotizacion.descuento}%):`, labelCol)
          .text(`-$${montoDescuento.toLocaleString('es-CL')}`, valueCol, doc.y - 12, {
            align: 'right',
            width: 80
          })
          .fillColor('#000000')
      }

      // Total
      doc
        .moveDown(0.5)
        .strokeColor('#333333')
        .lineWidth(2)
        .moveTo(350, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(0.3)

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text('TOTAL:', labelCol)
        .text(`$${cotizacion.precioFinal.toLocaleString('es-CL')}`, valueCol, doc.y - 15, {
          align: 'right',
          width: 80
        })
        .fillColor('#000000')
        .moveDown(2)

      // ======================
      // OBSERVACIONES
      // ======================
      if (cotizacion.observaciones) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('OBSERVACIONES:')
          .fontSize(9)
          .font('Helvetica')
          .text(cotizacion.observaciones, { align: 'justify' })
          .moveDown(1)
      }

      // ======================
      // CONDICIONES
      // ======================
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('CONDICIONES GENERALES:')
        .fontSize(8)
        .font('Helvetica')
        .text(`• Validez de la oferta: ${cotizacion.validez || 15} días`, { indent: 10 })
        .text('• Garantía del equipo: 1 año por defectos de fábrica', { indent: 10 })
        .text('• Garantía de instalación: 6 meses', { indent: 10 })
        .text('• Forma de pago: 50% al aprobar, 50% al finalizar instalación', { indent: 10 })
        .text('• Los precios incluyen IVA', { indent: 10 })
        .moveDown(1)

      // ======================
      // PIE DE PÁGINA - ⭐ AJUSTADO
      // ======================
      const bottomY = Math.max(doc.y, 680) // ⭐ Usar posición actual o mínimo 680
      
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('#666666')
        .text(
          'Este documento es una cotización no vinculante. Para proceder con el servicio es necesaria la aprobación formal.',
          50,
          bottomY,
          { align: 'center', width: 512 }
        )

      // ⭐ Agregar vendedor/agente INMEDIATAMENTE después (sin salto de página)
      if (cotizacion.agente) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(`Atendido por: ${cotizacion.agente}`, 50, bottomY + 15)
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
        .text(`Teléfono: ${ordenTrabajo.cliente.telefono}`)
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
          .text(`Capacidad: ${ordenTrabajo.equipo.capacidadBTU} BTU`)
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
        .text(`Duración estimada: ${ordenTrabajo.duracion} horas`)
        .text(`Costo total: $${ordenTrabajo.costoTotal?.toLocaleString('es-CL') || '0'}`)

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
