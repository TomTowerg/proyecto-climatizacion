import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decryptSensitiveFields } from '../utils/encryption.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * GENERAR PDF DE ORDEN DE TRABAJO
 * FORMATO 100% IDÉNTICO AL PDF DE COTIZACIONES + SECCIÓN DE FIRMAS
 */
export const generarPDFOrdenTrabajo = async (orden) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF de orden #${orden.id}...`)

      // Validar datos mínimos
      if (!orden.cliente) {
        throw new Error('La orden debe tener un cliente asociado')
      }

      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => {
        console.log('✅ PDF de orden generado exitosamente')
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', reject)

      // ⭐ DESCIFRAR DATOS DEL CLIENTE
      let clienteDescifrado = orden.cliente
      try {
        if (orden.cliente.rut_encrypted || 
            orden.cliente.email_encrypted || 
            orden.cliente.telefono_encrypted ||
            orden.cliente.direccion_encrypted) {
          clienteDescifrado = decryptSensitiveFields(orden.cliente)
        }
      } catch (error) {
        console.log('⚠️  Error al descifrar datos del cliente:', error.message)
      }

      // ============================================
      // LOGO
      // ============================================
      const possibleLogoPaths = [
        path.join(__dirname, '../../public/logo-kmts.png'),
        path.resolve(__dirname, '../../../frontend/public/logo-kmts.png'),
        path.resolve(__dirname, '../../..', 'frontend', 'public', 'logo-kmts.png'),
      ]

      let logoLoaded = false
      for (const logoPath of possibleLogoPaths) {
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 50, 45, { width: 80, height: 80 })
            logoLoaded = true
            break
          } catch (error) {
            // Error al cargar logo, continuar con siguiente ruta
          }
          
        }
      }

      if (!logoLoaded) {
        console.log('⚠️  Logo no encontrado, usando texto')
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('KMTS', 50, 50)
           .text('POWERTECH', 50, 62)
      }

      // ============================================
      // ENCABEZADO: ORDEN DE TRABAJO + FECHA + NÚMERO
      // ============================================
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('ORDEN DE TRABAJO', 140, 55, { align: 'center', width: 332 })
         .moveDown(0.3)

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#374151')
         .text(
           `N° ${orden.id.toString().padStart(6, '0')}  |  Fecha: ${new Date(orden.createdAt || Date.now()).toLocaleDateString('es-CL')}`,
           140,
           doc.y,
           { align: 'center', width: 332 }
         )

      // ============================================
      // EMPRESA Y CLIENTE (DOS COLUMNAS)
      // ============================================
      const dataY = 115

      // EMPRESA (Izquierda)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('DATOS DE LA EMPRESA', 50, dataY)

      doc.fontSize(9)
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
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('DATOS DEL CLIENTE', 320, dataY)

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1f2937')
         .text(clienteDescifrado.nombre || 'Cliente', 320, dataY + 15)

      doc.fontSize(8)
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
      doc.strokeColor('#1e3a8a')
         .lineWidth(2)
         .moveTo(50, dataY + 70)
         .lineTo(562, dataY + 70)
         .stroke()

      // ============================================
      // DIRECCIÓN DEL SERVICIO
      // ============================================
      // Buscar dirección válida (no vacía ni placeholder)
      let direccion = 'No especificada'
      
      if (orden.direccion && orden.direccion.trim() !== '') {
        direccion = orden.direccion.trim()
      } else if (orden.cotizacion?.direccionInstalacion && orden.cotizacion.direccionInstalacion.trim() !== '') {
        direccion = orden.cotizacion.direccionInstalacion.trim()
      } else if (orden.cotizacion?.direccion && orden.cotizacion.direccion.trim() !== '') {
        direccion = orden.cotizacion.direccion.trim()
      } else if (orden.notas && orden.notas.includes('Dirección:')) {
        const extracted = orden.notas.split('Dirección:')[1]?.trim()
        // Verificar que no sea vacío Y que no sea "No especificada"
        if (extracted && extracted !== '' && extracted !== 'No especificada') {
          direccion = extracted
        } else if (clienteDescifrado.direccion && clienteDescifrado.direccion.trim() !== '') {
          // Fallback: usar dirección del cliente
          direccion = clienteDescifrado.direccion.trim()
        }
      } else if (clienteDescifrado.direccion && clienteDescifrado.direccion.trim() !== '') {
        direccion = clienteDescifrado.direccion.trim()
      }

      doc.fontSize(10)
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

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('TIPO DE SERVICIO', 50, dataY + 120)
         .fontSize(9)
         .fillColor('#1f2937')
         .text(tipoTexto[orden.tipo] || 'SERVICIO', 50, dataY + 135)

      // ============================================
      // ⭐ EQUIPOS (MÚLTIPLES O ÚNICO)
      // ============================================
      let equipoY = dataY + 160

      // ⭐ VERIFICAR SI HAY MÚLTIPLES EQUIPOS (desde cotización)
      if (orden.cotizacion?.equipos && orden.cotizacion.equipos.length > 0) {
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('EQUIPOS INSTALADOS', 50, equipoY)

        equipoY += 18

        // Encabezado de tabla
        const tableTop = equipoY
        doc.rect(50, tableTop, 512, 20)
           .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text('Equipo', 60, tableTop + 6)
           .text('Cantidad', 290, tableTop + 6)
           .text('Precio Unit.', 370, tableTop + 6)
           .text('Subtotal', 480, tableTop + 6)

        let currentY = tableTop + 25

        orden.cotizacion.equipos.forEach((equipoItem, index) => {
          const inv = equipoItem.inventario

          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            doc.rect(50, currentY, 512, 20)
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

          if (index % 2 === 0) {
            doc.rect(50, currentY - 3, 512, 22)  // ✅ Altura aumentada
               .fillAndStroke('#f9fafb', '#f9fafb')
          }

          // Línea 1: Marca y modelo
          const lineaUno = `${inv.marca} ${inv.modelo}`
          // Línea 2: Tipo y capacidad
          const lineaDos = `${inv.tipo || ''} ${inv.capacidadBTU ? '- ' + inv.capacidadBTU + ' BTU' : ''}`

          doc.fontSize(8)
             .font('Helvetica-Bold')
             .fillColor('#1f2937')
             .text(lineaUno, 60, currentY, { width: 210 })
             .fontSize(7)
             .font('Helvetica')
             .fillColor('#6b7280')
             .text(lineaDos, 60, currentY + 10, { width: 210 })
             .fontSize(8)
             .font('Helvetica')
             .fillColor('#1f2937')
             .text(equipoItem.cantidad.toString(), 290, currentY + 4)
             .text(`$${equipoItem.precioUnitario.toLocaleString('es-CL')}`, 370, currentY + 4)
             .text(`$${equipoItem.subtotal.toLocaleString('es-CL')}`, 480, currentY + 4)

          currentY += 22  // ✅ Aumentado
        })

        const totalEquipos = orden.cotizacion.equipos.reduce((sum, eq) => sum + eq.subtotal, 0)
        
        doc.rect(380, currentY + 5, 182, 18)
           .fillAndStroke('#dbeafe', '#2563eb')
           .fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('Total Equipos:', 390, currentY + 10)
           .text(`$${totalEquipos.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35

      } else if (orden.equipo) {
        // Sistema antiguo - un solo equipo
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('DETALLE DEL EQUIPO', 50, equipoY)

        equipoY += 18

        doc.rect(50, equipoY, 512, 65)
           .fillAndStroke('#f9fafb', '#e5e7eb')

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1f2937')
           .text(`${orden.equipo.marca} ${orden.equipo.modelo}`, 60, equipoY + 8)
           .fontSize(8)
           .font('Helvetica')
           .fillColor('#374151')
           .text(`Capacidad: ${orden.equipo.capacidad || 'N/A'}`, 60, equipoY + 25)
           .text(`Tipo: ${orden.equipo.tipo}`, 60, equipoY + 39)

        // Precio del equipo
        if (orden.costoTotal || orden.cotizacion?.precioOfertado) {
          doc.font('Helvetica-Bold')
             .fillColor('#1e3a8a')
             .text(
               `Precio: $${(orden.costoTotal || orden.cotizacion?.precioOfertado || 0).toLocaleString('es-CL')}`,
               410,
               equipoY + 25,
               { align: 'right', width: 140 }
             )
        }

        equipoY += 75
      }

      // ============================================
      // ⭐ MATERIALES INCLUIDOS
      // ============================================
      if (orden.cotizacion?.materiales && orden.cotizacion.materiales.length > 0) {
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('MATERIALES UTILIZADOS', 50, equipoY)

        equipoY += 18

        const matTableTop = equipoY

        doc.rect(50, matTableTop, 512, 20)
           .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text('Material', 60, matTableTop + 6)
           .text('Cantidad', 290, matTableTop + 6)
           .text('Precio Unit.', 370, matTableTop + 6)
           .text('Subtotal', 480, matTableTop + 6)

        let currentY = matTableTop + 25

        orden.cotizacion.materiales.forEach((material, index) => {
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            doc.rect(50, currentY, 512, 20)
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
            doc.rect(50, currentY - 3, 512, 18)
               .fillAndStroke('#f9fafb', '#f9fafb')
          }

          doc.fontSize(8)
             .font('Helvetica')
             .fillColor('#1f2937')
             .text(material.nombre, 60, currentY, { width: 210 })
             .text(`${material.cantidad} ${material.unidad}`, 290, currentY)
             .text(`$${material.precioUnitario.toLocaleString('es-CL')}`, 370, currentY)
             .text(`$${material.subtotal.toLocaleString('es-CL')}`, 480, currentY)

          currentY += 18
        })

        const totalMateriales = orden.cotizacion.materiales.reduce((sum, mat) => sum + mat.subtotal, 0)

        doc.rect(380, currentY + 5, 182, 18)
           .fillAndStroke('#dbeafe', '#2563eb')
           .fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#1e3a8a')
           .text('Total Materiales:', 390, currentY + 10)
           .text(`$${totalMateriales.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35
      }

      // ============================================
      // ✅ MEJORA CRÍTICA: CONDICIONES Y DESGLOSE
      // ============================================
      
      // Calcular la altura necesaria para condiciones + desglose
      const condicionesHeight = 70
      
      // Obtener costos primero (movido aquí para calcular desgloseHeight)
      const cotizacion = orden.cotizacion
      const precioOfertado = cotizacion?.precioOfertado || orden.costoManoObra || 0
      const costoInstalacion = cotizacion?.costoInstalacion || 100000
      const costoMaterial = cotizacion?.costoMaterial || orden.costoMateriales || 0
      const subtotal = cotizacion?.subtotal || (precioOfertado + costoInstalacion + costoMaterial)
      const descuento = cotizacion?.descuento || 0
      const precioFinal = cotizacion?.precioFinal || (subtotal - descuento)

      const desgloseHeight = 
        25 + 
        (costoInstalacion > 0 ? 15 : 0) +
        (costoMaterial > 0 ? 15 : 0) +
        15 + 
        (descuento > 0 ? 15 : 0) +
        45

      // Usar el mayor + margen de seguridad
      const totalBottomSectionHeight = Math.max(condicionesHeight, desgloseHeight) + 40
      
      // ✅ CORRECCIÓN: Calcular finalBottomY después de todos los contenidos
      let finalBottomY = equipoY + 10

      // ✅ LÍMITE MÁS CONSERVADOR: Si no hay espacio suficiente, crear nueva página
      // Usar 640 en lugar de 680 para ser más conservador
      if (finalBottomY + totalBottomSectionHeight > 640) {
        doc.addPage()
        
        // ============================================
        // ✅ ENCABEZADO COMPLETO EN PÁGINA 2
        // ============================================
        
        // LOGO (intentar cargar)
        let logoLoadedPage2 = false
        for (const logoPath of possibleLogoPaths) {
          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, 45, { width: 60, height: 60 })
              logoLoadedPage2 = true
              break
            } catch (error) {
              // Continuar si falla
            }
          }
        }
        
        if (!logoLoadedPage2) {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#1e3a8a')
            .text('KMTS', 50, 50)
            .text('POWERTECH', 50, 60)
        }
        
        // TÍTULO CENTRADO
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('ORDEN DE TRABAJO', 0, 50, { align: 'center', width: 612 })
        
        // Número y Fecha
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#374151')
          .text(
            `N° ${String(orden.id).padStart(6, '0')}`,
            0,
            85,
            { align: 'center', width: 612 }
          )
        
        // LÍNEA SEPARADORA
        doc
          .strokeColor('#1e3a8a')
          .lineWidth(3)
          .moveTo(50, 110)
          .lineTo(562, 110)
          .stroke()
        
        finalBottomY = 130  // ✅ Inicia después del encabezado completo
      }

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('CONDICIONES GENERALES', 50, finalBottomY)

      const condicionesY = finalBottomY + 18

      // Fondo azul claro para las condiciones
      doc
        .roundedRect(40, condicionesY - 8, 260, 90, 5)
        .fill('#eff6ff')

      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor('#374151')
         .text('• Forma de pago: Efectivo, Tarjeta, Transferencia. Abono inicial (70%).', 50, condicionesY, { width: 240 })
         .text(`• Validez de la oferta: ${orden.cotizacion?.validez || 5} días hábiles o hasta agotar stock.`, 50, condicionesY + 12, { width: 240 })
         .text('• Garantía del equipo: Según lo estipulado por el fabricante.', 50, condicionesY + 24, { width: 240 })
         .text('• Los precios incluyen IVA.', 50, condicionesY + 36, { width: 240 })
         .text('• La instalación cuenta con una garantía de 1 año, aplicable únicamente a defectos o inconvenientes atribuibles al proceso de instalación.', 50, condicionesY + 48, { width: 240 })

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('DESGLOSE DE COSTOS', 320, finalBottomY)

      const desgloseY = finalBottomY + 18

      doc.rect(320, desgloseY, 242, desgloseHeight)
         .fillAndStroke('#ffffff', '#e5e7eb')

      let lineY = desgloseY + 10

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#374151')
         .text('Equipo:', 330, lineY)
         .text(`$${precioOfertado.toLocaleString('es-CL')}`, 480, lineY, {
           align: 'right',
           width: 70
         })

      lineY += 15

      if (costoInstalacion > 0) {
        doc.text('Instalación:', 330, lineY)
           .text(`$${costoInstalacion.toLocaleString('es-CL')}`, 480, lineY, {
             align: 'right',
             width: 70
           })
        lineY += 15
      }

      if (costoMaterial > 0) {
        doc.text('Materiales:', 330, lineY)
           .text(`$${costoMaterial.toLocaleString('es-CL')}`, 480, lineY, {
             align: 'right',
             width: 70
           })
        lineY += 15
      }

      lineY += 5
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(330, lineY)
         .lineTo(552, lineY)
         .stroke()
      lineY += 8

      doc.font('Helvetica-Bold')
         .text('Subtotal:', 330, lineY)
         .text(`$${subtotal.toLocaleString('es-CL')}`, 480, lineY, {
           align: 'right',
           width: 70
         })

      lineY += 15

      if (descuento > 0) {
        const montoDescuento = subtotal - precioFinal
        doc.fillColor('#dc2626')
           .font('Helvetica')
           .text(`Descuento (${descuento}%):`, 330, lineY)
           .text(`-$${montoDescuento.toLocaleString('es-CL')}`, 480, lineY, {
             align: 'right',
             width: 70
           })
           .fillColor('#374151')
        lineY += 15
      }

      lineY += 5
      doc.strokeColor('#1e3a8a')
         .lineWidth(2)
         .moveTo(330, lineY)
         .lineTo(552, lineY)
         .stroke()
      lineY += 10

      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor('#1e3a8a')
         .text('TOTAL:', 330, lineY)
         .text(`$${precioFinal.toLocaleString('es-CL')}`, 450, lineY, {
           align: 'right',
           width: 100
         })

      // ============================================
      // ⭐ SECCIÓN COMPLETA: FIRMAS Y OBSERVACIONES
      // ============================================
      let seccionY = finalBottomY + desgloseHeight + 40

      if (seccionY > 550) {
        doc.addPage()
        seccionY = 60
      }

      // ✅ TÍTULO PRINCIPAL (VA PRIMERO)
      doc
        .fontSize(14)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text('FIRMAS Y OBSERVACIONES', 50, seccionY)

      seccionY += 35

      // Obtener observaciones de la cotización o de la orden
      const observaciones = orden.cotizacion?.observaciones || 
                           orden.cotizacion?.notas || 
                           orden.notas || 
                           orden.descripcion || 
                           ''

      // ✅ SUBSECCIÓN: OBSERVACIONES (si existen)
      if (observaciones && observaciones.trim() !== '') {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('OBSERVACIONES', 50, seccionY)

        seccionY += 18

        // Calcular altura del recuadro
        const observacionesHeight = Math.min(
          doc.heightOfString(observaciones, { width: 512, align: 'justify' }) + 20,
          100
        )

        // Recuadro para las observaciones
        doc
          .rect(50, seccionY, 512, observacionesHeight)
          .fillAndStroke('#f9fafb', '#e5e7eb')

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#374151')
          .text(observaciones, 60, seccionY + 10, { 
            width: 492, 
            align: 'justify',
            lineGap: 2
          })

        seccionY += observacionesHeight + 25
      }

      // ✅ FIRMAS (después de observaciones o directamente después del título)
      let firmasY = seccionY

      const firmaCol1 = 80
      const firmaCol2 = 350

      // FIRMA DE LA EMPRESA
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica-Bold')
         .text('EMPRESA', firmaCol1, firmasY, { align: 'center', width: 150 })

      doc.moveTo(firmaCol1, firmasY + 65)
         .lineTo(firmaCol1 + 150, firmasY + 65)
         .strokeColor('#6b7280')
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Firma Empresa', firmaCol1, firmasY + 75, { align: 'center', width: 150 })
      
      doc.text('KMTS POWERTECH SPA', firmaCol1, firmasY + 90, { align: 'center', width: 150 })

      // FIRMA DEL CLIENTE
      doc.fontSize(10)
         .fillColor('#6b7280')
         .font('Helvetica-Bold')
         .text('CLIENTE', firmaCol2, firmasY, { align: 'center', width: 150 })

      doc.moveTo(firmaCol2, firmasY + 65)
         .lineTo(firmaCol2 + 150, firmasY + 65)
         .strokeColor('#6b7280')
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Firma del Cliente', firmaCol2, firmasY + 75, { align: 'center', width: 150 })
      
      doc.text(clienteDescifrado.nombre || 'Cliente', firmaCol2, firmasY + 90, { align: 'center', width: 150 })

      firmasY += 120

      // Texto de conformidad
      doc.fontSize(8)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(
           'El cliente declara haber recibido el servicio conforme y autoriza el trabajo realizado.',
           50,
           firmasY,
           { width: 512, align: 'center' }
         )

      // ============================================
      // PIE DE PÁGINA
      // ============================================
      const footerY = 720

      doc.fontSize(7)
         .font('Helvetica-Oblique')
         .fillColor('#6b7280')
         .text(
           'Este documento es una orden de trabajo formal. Para cualquier consulta contactar a KMTS POWERTECH.',
           50,
           footerY,
           { align: 'center', width: 512 }
         )

      doc.end()

    } catch (error) {
      console.error('❌ Error al generar PDF:', error)
      console.error('Stack:', error.stack)
      reject(error)
    }
  })
}

export default { generarPDFOrdenTrabajo }