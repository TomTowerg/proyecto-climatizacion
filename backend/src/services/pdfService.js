import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decryptSensitiveFields } from '../utils/encryption.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SERVICIO DE GENERACIÓN DE PDF - VERSIÓN CORREGIDA
 * ✅ Manejo correcto de páginas cuando hay muchos equipos/materiales
 * ✅ Condiciones y desglose siempre visibles y alineados
 */

/**
 * GENERAR PDF DE COTIZACIÓN
 */
export const generarPDFCotizacion = async (cotizacion) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de cotizacion #${cotizacion.id}...`)
      console.log(`📦 Equipos múltiples: ${cotizacion.equipos?.length || 0}`)
      console.log(`📦 Materiales: ${cotizacion.materiales?.length || 0}`)

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
      const possibleLogoPaths = [
        path.join(__dirname, '../../public/logo-kmts.png'),
        path.resolve(__dirname, '../../../frontend/public/logo-kmts.png'),
        path.resolve(__dirname, '../../..', 'frontend', 'public', 'logo-kmts.png'),
        'C:\\proyecto-climatizacion\\frontend\\public\\logo-kmts.png',
        'C:\\proyecto-climatizacion\\backend\\public\\logo-kmts.png',
      ]

      let logoLoaded = false
      
      for (const logoPath of possibleLogoPaths) {
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 50, 45, { width: 80, height: 80 })
            console.log('✅ Logo cargado desde:', logoPath)
            logoLoaded = true
            break
          } catch (error) {
            console.log('❌ Error al cargar logo:', error.message)
          }
        }
      }

      // Si no se cargó, usar texto como fallback
      if (!logoLoaded) {
        console.log('⚠️  Logo no encontrado, usando texto')
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('KMTS', 50, 50)
          .text('POWERTECH', 50, 62)
      }

      // ============================================
      // ENCABEZADO: COTIZACIÓN + FECHA + NÚMERO
      // ============================================
      const dataY = 50

      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('COTIZACIÓN', 300, dataY, { align: 'right', width: 250 })

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`N° ${cotizacion.id}`, 300, dataY + 28, { align: 'right', width: 250 })
        .text(
          `Fecha: ${new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CL')}`,
          300,
          dataY + 42,
          { align: 'right', width: 250 }
        )

      // ============================================
      // DATOS DEL CLIENTE
      // ============================================
      const clienteDescifrado = decryptSensitiveFields(cotizacion.cliente)

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('CLIENTE', 50, dataY + 28)
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text(cotizacion.cliente.nombre, 50, dataY + 44, { width: 250 })

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')

      let clienteY = dataY + 28

      if (clienteDescifrado.rut) {
        doc.text(`RUT: ${clienteDescifrado.rut}`, 320, clienteY)
        clienteY += 12
      }

      if (clienteDescifrado.telefono) {
        doc.text(`Teléfono: ${clienteDescifrado.telefono}`, 320, clienteY)
        clienteY += 12
      }

      if (clienteDescifrado.email) {
        doc.text(`Email: ${clienteDescifrado.email}`, 320, clienteY, { width: 230 })
        clienteY += 12
      }

      // LÍNEA SEPARADORA
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(50, dataY + 70)
        .lineTo(562, dataY + 70)
        .stroke()

      // ============================================
      // DIRECCIÓN DEL SERVICIO
      // ============================================
      const direccion = cotizacion.direccionInstalacion || 
                       clienteDescifrado.direccion || 
                       'No especificada'

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DIRECCIÓN DEL SERVICIO', 50, dataY + 85)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text(direccion, 50, dataY + 100, { width: 500 })

      // ============================================
      // TIPO DE SERVICIO
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
        .text('TIPO DE SERVICIO', 50, dataY + 120)
        .fontSize(9)
        .fillColor('#1f2937')
        .text(tipoTexto[cotizacion.tipo] || 'SERVICIO', 50, dataY + 135)

      // ============================================
      // ⭐ EQUIPOS (MÚLTIPLES O ÚNICO)
      // ============================================
      let equipoY = dataY + 160

      // ⭐ NUEVO: Verificar si hay múltiples equipos
      if (cotizacion.equipos && cotizacion.equipos.length > 0) {
        console.log('✅ Mostrando múltiples equipos en PDF')
        
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('EQUIPOS COTIZADOS', 50, equipoY)

        equipoY += 18

        // Encabezado de tabla
        const tableTop = equipoY
        doc
          .rect(50, tableTop, 512, 20)
          .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Equipo', 60, tableTop + 6)
          .text('Cantidad', 290, tableTop + 6)
          .text('Precio Unit.', 370, tableTop + 6)
          .text('Subtotal', 480, tableTop + 6)

        let currentY = tableTop + 25

        cotizacion.equipos.forEach((equipoItem, index) => {
          const inv = equipoItem.inventario

          // ✅ MEJORA: Verificar si necesitamos nueva página (dejando espacio para footer)
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            // Re-dibujar encabezado en nueva página
            doc
              .rect(50, currentY, 512, 20)
              .fillAndStroke('#1e3a8a', '#1e3a8a')
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Equipo', 60, currentY + 6)
              .text('Cantidad', 290, currentY + 6)
              .text('Precio Unit.', 370, currentY + 6)
              .text('Subtotal', 480, currentY + 6)

            currentY += 25
          }

          // Fila alternada
          if (index % 2 === 0) {
            doc
              .rect(50, currentY - 3, 512, 18)
              .fillAndStroke('#f9fafb', '#f9fafb')
          }

          // Datos del equipo
          const equipoDescripcion = `${inv.tipo} ${inv.marca} ${inv.modelo} - ${inv.capacidadBTU} BTU`
          
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(equipoDescripcion, 60, currentY, { width: 210 })
            .text(equipoItem.cantidad.toString(), 290, currentY)
            .text(`$${equipoItem.precioUnitario.toLocaleString('es-CL')}`, 370, currentY)
            .text(`$${equipoItem.subtotal.toLocaleString('es-CL')}`, 480, currentY)

          currentY += 18
        })

        equipoY = currentY + 10
      } else if (cotizacion.inventario) {
        // Equipo único (viejo flujo)
        console.log('✅ Mostrando equipo único en PDF')

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('EQUIPO COTIZADO', 50, equipoY)

        const boxTop = equipoY + 18

        doc
          .rect(50, boxTop, 512, 60)
          .fillAndStroke('#ffffff', '#e5e7eb')

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1f2937')
          .text(
            `${cotizacion.inventario.tipo} ${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`,
            60,
            equipoY + 25
          )
          .fontSize(9)
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
        console.log('✅ Mostrando materiales en PDF')
        
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('MATERIALES INCLUIDOS', 50, equipoY)

        equipoY += 18

        const matTableTop = equipoY

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

        cotizacion.materiales.forEach((material, index) => {
          // ✅ MEJORA: Verificar si necesitamos nueva página (dejando espacio para footer)
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

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
      // ✅ MEJORA CRÍTICA: CONDICIONES Y DESGLOSE
      // ============================================
      
      // Calcular la altura necesaria para condiciones + desglose
      // IMPORTANTE: Las condiciones y desglose van lado a lado, así que usamos el MAYOR de ambos
      const condicionesHeight = 70  // Altura de las condiciones generales
      const desgloseHeight = 
        25 +  // Base
        (cotizacion.costoInstalacion > 0 ? 15 : 0) +
        (cotizacion.costoMaterial > 0 ? 15 : 0) +
        15 +  // Subtotal
        (cotizacion.descuento > 0 ? 15 : 0) +
        45    // Total y espaciado

      // Usar el mayor + margen de seguridad
      const totalBottomSectionHeight = Math.max(condicionesHeight, desgloseHeight) + 40
      
      // ✅ CORRECCIÓN: Calcular finalBottomY después de todos los contenidos
      let finalBottomY = equipoY + 10

      // ✅ LÍMITE MÁS CONSERVADOR: Si no hay espacio suficiente, crear nueva página
      // Usar 640 en lugar de 680 para ser más conservador
      if (finalBottomY + totalBottomSectionHeight > 640) {
        console.log('⚠️  Creando nueva página para condiciones y desglose')
        doc.addPage()
        
        // ✅ Agregar mini encabezado en página 2
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Cotización N° ${cotizacion.id} - ${cotizacion.cliente.nombre}`, 50, 50, { 
            width: 512, 
            align: 'center' 
          })
        
        // Línea separadora
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, 70)
          .lineTo(562, 70)
          .stroke()
        
        finalBottomY = 90  // ✅ Inicia después del mini encabezado
      }

      // CONDICIONES GENERALES
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('CONDICIONES GENERALES', 50, finalBottomY)

      const condicionesY = finalBottomY + 18

      doc
        .roundedRect(40, condicionesY - 8, 260, 90, 5) // (x, y, ancho, alto, radio del borde)
        .fill('#eff6ff'); // Un azul muy claro y elegante para no opacar el texto
      // --- FIN: Fondo Rectángulo Azul ---

      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#374151') // Tu color de texto original
        .text('• Forma de pago: Efectivo, Tarjeta, Transferencia. Abono inicial (70%).', 50, condicionesY, { width: 240 })
        .text(`• Validez de la oferta: ${cotizacion.validez || 5} días hábiles o hasta agotar stock.`, 50, condicionesY + 12, { width: 240 })
        .text('• Garantía del equipo: Según lo estipulado por el fabricante.', 50, condicionesY + 24, { width: 240 })
        .text('• Los precios incluyen IVA.', 50, condicionesY + 36, { width: 240 })
        .text('• La instalación cuenta con una garantía de 1 año, aplicable únicamente a defectos o inconvenientes atribuibles al proceso de instalación.', 50, condicionesY + 48, { width: 240 })
              
      // DESGLOSE DE COSTOS
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DESGLOSE DE COSTOS', 320, finalBottomY)

      const desgloseY = finalBottomY + 18

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

      lineY += 5
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(330, lineY)
        .lineTo(552, lineY)
        .stroke()
      lineY += 10

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

// ... resto del archivo (función de orden de trabajo, etc.)

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

      doc
        .strokeColor('#1e3a8a')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .stroke()
        .moveDown(1)

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text(`TIPO: ${ordenTrabajo.tipo.toUpperCase()}`, { align: 'center' })
        .fillColor(ordenTrabajo.estado === 'pendiente' ? '#f59e0b' : '#10b981')
        .text(`Estado: ${ordenTrabajo.estado.toUpperCase()}`, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1)

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