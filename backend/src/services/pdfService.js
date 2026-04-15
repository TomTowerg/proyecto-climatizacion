import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decryptSensitiveFields, decryptAddress } from '../utils/encryption.js'

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
            doc.image(logoPath, 50, 45, { width: 70, height: 70 })
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
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('KMTS', 50, 50)
          .text('POWERTECH', 50, 64)
      }

      // ============================================
      // TÍTULO: COTIZACIÓN (CENTRADO Y GRANDE)
      // ============================================
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('COTIZACIÓN', 0, 50, { align: 'center', width: 612 })

      // Número y Fecha debajo del título (centrado)
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          `N° ${String(cotizacion.id).padStart(6, '0')} | Fecha: ${new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
          0,
          85,
          { align: 'center', width: 612 }
        )

      // ============================================
      // SECCIÓN DE DOS COLUMNAS: EMPRESA Y CLIENTE
      // ============================================
      const dataY = 110
      
      // ⬅️ COLUMNA IZQUIERDA: DATOS DE LA EMPRESA
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DATOS DE LA EMPRESA', 50, dataY)
      
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text('KMTS POWERTECH SPA', 50, dataY + 18)
      
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text('RUT: 78.163.187-6', 50, dataY + 32)
        .text('Teléfono: +56 9 5451 0454', 50, dataY + 44)
        .text('Email: kmtspowertech@gmail.com', 50, dataY + 56)

      // ➡️ COLUMNA DERECHA: DATOS DEL CLIENTE
      const clienteDescifrado = decryptSensitiveFields(cotizacion.cliente)
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DATOS DEL CLIENTE', 320, dataY)
      
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text(cotizacion.cliente.nombre, 320, dataY + 18, { width: 242 })
      
      let clienteY = dataY + 32
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
      
      if (clienteDescifrado.rut) {
        doc.text(`RUT: ${clienteDescifrado.rut}`, 320, clienteY)
        clienteY += 12
      }
      
      if (clienteDescifrado.telefono) {
        doc.text(`Teléfono: ${clienteDescifrado.telefono}`, 320, clienteY)
        clienteY += 12
      }
      
      if (clienteDescifrado.email) {
        doc.text(`Email: ${clienteDescifrado.email}`, 320, clienteY, { width: 242 })
        clienteY += 12
      }

      // LÍNEA SEPARADORA AZUL GRUESA
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(3)
        .moveTo(50, dataY + 78)
        .lineTo(562, dataY + 78)
        .stroke()

      // ============================================
      // DIRECCIÓN DEL SERVICIO
      // ============================================
      const direccionCliente = clienteDescifrado.direccion ||
        (cotizacion.cliente?.direcciones?.[0]?.direccion_encrypted
          ? decryptAddress(cotizacion.cliente.direcciones[0].direccion_encrypted)
          : null)
      const direccion = cotizacion.direccionInstalacion || direccionCliente || 'No especificada'

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('DIRECCIÓN DEL SERVICIO', 50, dataY + 95)
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#374151')
        .text(direccion, 50, dataY + 110, { width: 500 })

      // ============================================
      // TIPO DE SERVICIO
      // ============================================
      const tipoTexto = {
        instalacion: 'INSTALACIÓN',
        mantencion: 'MANTENCIÓN',
        reparacion: 'REPARACIÓN',
        visita_tecnica: 'VISITA TÉCNICA',
        desinstalacion: 'DESINSTALACIÓN'
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('TIPO DE SERVICIO', 50, dataY + 135)
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(tipoTexto[cotizacion.tipo] || 'SERVICIO', 50, dataY + 150)

      // ============================================
      // ⭐ EQUIPOS (MÚLTIPLES O ÚNICO)
      // ============================================
      let equipoY = dataY + 170

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
              .rect(50, currentY - 3, 512, 22)  // ✅ Altura aumentada de 18 a 22
              .fillAndStroke('#f9fafb', '#f9fafb')
          }

          // Datos del equipo - LÍNEA 1: Marca y modelo
          const lineaUno = `${inv.marca} ${inv.modelo}`
          // LÍNEA 2: Tipo y capacidad
          const lineaDos = `${inv.tipo} - ${inv.capacidadBTU} BTU`
          
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text(lineaUno, 60, currentY, { width: 210 })
            .fontSize(7)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(lineaDos, 60, currentY + 10, { width: 210 })
          
          // Cantidad, Precio y Subtotal (centrados verticalmente)
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(equipoItem.cantidad.toString(), 290, currentY + 4)
            .text(`$${equipoItem.precioUnitario.toLocaleString('es-CL')}`, 370, currentY + 4)
            .text(`$${equipoItem.subtotal.toLocaleString('es-CL')}`, 480, currentY + 4)

          currentY += 22  // ✅ Aumentado de 18 a 22
        })

        // ✅ AGREGAR TOTAL DE EQUIPOS
        const totalEquipos = cotizacion.equipos.reduce((sum, eq) => sum + eq.subtotal, 0)
        
        doc
          .rect(380, currentY + 5, 182, 18)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('Total Equipos:', 390, currentY + 10)
          .text(`$${totalEquipos.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35
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
      // INSTALACIONES
      // ============================================
      if (cotizacion.instalaciones && cotizacion.instalaciones.length > 0) {
        console.log('✅ Mostrando instalaciones en PDF')

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('COSTOS DE INSTALACIÓN', 50, equipoY)

        equipoY += 18

        const instTableTop = equipoY

        doc
          .rect(50, instTableTop, 512, 20)
          .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Instalación', 60, instTableTop + 6)
          .text('Precio', 320, instTableTop + 6)
          .text('Desc. %', 400, instTableTop + 6)
          .text('Subtotal', 480, instTableTop + 6)

        let currentY = instTableTop + 25

        cotizacion.instalaciones.forEach((inst, index) => {
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            doc
              .rect(50, currentY, 512, 20)
              .fillAndStroke('#1e3a8a', '#1e3a8a')
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Instalación', 60, currentY + 6)
              .text('Precio', 320, currentY + 6)
              .text('Desc. %', 400, currentY + 6)
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
            .text(inst.nombre, 60, currentY, { width: 240 })
            .text(`$${inst.precio.toLocaleString('es-CL')}`, 320, currentY)
            .text(inst.descuento > 0 ? `${inst.descuento}%` : '-', 400, currentY)
            .text(`$${inst.subtotal.toLocaleString('es-CL')}`, 480, currentY)

          currentY += 18
        })

        const totalInstalaciones = cotizacion.instalaciones.reduce((sum, inst) => sum + inst.subtotal, 0)

        doc
          .rect(380, currentY + 5, 182, 18)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('Total Instalación:', 390, currentY + 10)
          .text(`$${totalInstalaciones.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35
      }

      // ============================================
      // COSTOS DEL SERVICIO (MANTENCIONES)
      // ============================================
      if (cotizacion.mantenciones && cotizacion.mantenciones.length > 0) {
        console.log('✅ Mostrando mantenciones en PDF')

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('COSTOS DEL SERVICIO', 50, equipoY)

        equipoY += 18

        const mantTableTop = equipoY

        doc
          .rect(50, mantTableTop, 512, 20)
          .fillAndStroke('#1e3a8a', '#1e3a8a')

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Servicio', 60, mantTableTop + 6)
          .text('Precio', 320, mantTableTop + 6)
          .text('Desc. %', 400, mantTableTop + 6)
          .text('Subtotal', 480, mantTableTop + 6)

        let currentY = mantTableTop + 25

        cotizacion.mantenciones.forEach((mant, index) => {
          if (currentY > 680) {
            doc.addPage()
            currentY = 60

            doc
              .rect(50, currentY, 512, 20)
              .fillAndStroke('#1e3a8a', '#1e3a8a')
              .fontSize(8)
              .font('Helvetica-Bold')
              .fillColor('#ffffff')
              .text('Servicio', 60, currentY + 6)
              .text('Precio', 320, currentY + 6)
              .text('Desc. %', 400, currentY + 6)
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
            .text(mant.nombre, 60, currentY, { width: 240 })
            .text(`$${mant.precio.toLocaleString('es-CL')}`, 320, currentY)
            .text(mant.descuento > 0 ? `${mant.descuento}%` : '-', 400, currentY)
            .text(`$${mant.subtotal.toLocaleString('es-CL')}`, 480, currentY)

          currentY += 18
        })

        const totalMantenciones = cotizacion.mantenciones.reduce((sum, m) => sum + m.subtotal, 0)

        doc
          .rect(380, currentY + 5, 182, 18)
          .fillAndStroke('#dbeafe', '#2563eb')
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('Total Servicio:', 390, currentY + 10)
          .text(`$${totalMantenciones.toLocaleString('es-CL')}`, 480, currentY + 10)

        equipoY = currentY + 35
      }

      // ============================================
      // ✅ MEJORA CRÍTICA: CONDICIONES Y DESGLOSE
      // ============================================

      const condicionesHeight = 70

      // CALCULAR VALORES BRUTOS CORRECTAMENTE (sin doble-conteo de mantenciones)
      const originalEquipos = cotizacion.equipos && cotizacion.equipos.length > 0
        ? cotizacion.equipos.reduce((sum, e) => sum + (e.precioUnitario * e.cantidad), 0)
        : 0

      const originalMantenciones = cotizacion.mantenciones && cotizacion.mantenciones.length > 0
        ? cotizacion.mantenciones.reduce((sum, m) => sum + m.subtotal, 0)
        : 0

      // Fallback legacy: si ningún array tiene datos, usar precioOfertado
      const servicioFallback = (originalEquipos === 0 && originalMantenciones === 0)
        ? (cotizacion.precioOfertado || 0)
        : 0

      const originalMateriales = cotizacion.materiales && cotizacion.materiales.length > 0
        ? cotizacion.materiales.reduce((sum, m) => sum + (m.precioUnitario * m.cantidad), 0)
        : (cotizacion.costoMaterial || 0)

      const originalInstalaciones = cotizacion.instalaciones && cotizacion.instalaciones.length > 0
        ? cotizacion.instalaciones.reduce((sum, i) => sum + i.precio, 0)
        : (cotizacion.costoInstalacion || 0)

      const subtotalBruto = originalEquipos + originalMantenciones + servicioFallback + originalMateriales + originalInstalaciones
      const totalDescuentoAbsoluto = subtotalBruto - cotizacion.precioFinal

      const desgloseHeight =
        25 +
        (originalEquipos > 0 ? 15 : 0) +
        (originalMantenciones > 0 || servicioFallback > 0 ? 15 : 0) +
        (originalInstalaciones > 0 ? 15 : 0) +
        (originalMateriales > 0 ? 15 : 0) +
        15 +
        (totalDescuentoAbsoluto > 0 ? 15 : 0) +
        45

      const totalBottomSectionHeight = Math.max(condicionesHeight, desgloseHeight) + 40
      
      // ✅ CORRECCIÓN: Calcular finalBottomY después de todos los contenidos
      let finalBottomY = equipoY + 10

      // ✅ LÍMITE MÁS CONSERVADOR: Si no hay espacio suficiente, crear nueva página
      // Usar 640 en lugar de 680 para ser más conservador
      if (finalBottomY + totalBottomSectionHeight > 640) {
        console.log('⚠️  Creando nueva página para condiciones y desglose')
        doc.addPage()
        
        // ============================================
        // ✅ ENCABEZADO PÁGINA 2 (MISMO FORMATO QUE PÁGINA 1)
        // ============================================
        
        // LOGO
        let logoLoadedPage2 = false
        for (const logoPath of possibleLogoPaths) {
          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 50, 45, { width: 70, height: 70 })
              logoLoadedPage2 = true
              break
            } catch (error) {
              // Continuar si falla
            }
          }
        }
        
        if (!logoLoadedPage2) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#1e3a8a')
            .text('KMTS', 50, 50)
            .text('POWERTECH', 50, 64)
        }
        
        // TÍTULO CENTRADO
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('COTIZACIÓN', 0, 50, { align: 'center', width: 612 })
        
        // Número y Fecha
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#374151')
          .text(
            `N° ${String(cotizacion.id).padStart(6, '0')} | Fecha: ${new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
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
        
        finalBottomY = 130  // ✅ Inicia después del encabezado
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

      if (originalEquipos > 0) {
        doc
          .text('Equipo:', 330, lineY)
          .text(`$${originalEquipos.toLocaleString('es-CL')}`, 480, lineY, { align: 'right', width: 70 })
        lineY += 15
      }

      if (originalMantenciones > 0) {
        doc
          .text('Servicio:', 330, lineY)
          .text(`$${originalMantenciones.toLocaleString('es-CL')}`, 480, lineY, { align: 'right', width: 70 })
        lineY += 15
      } else if (servicioFallback > 0) {
        doc
          .text('Equipo/Serv.:', 330, lineY)
          .text(`$${servicioFallback.toLocaleString('es-CL')}`, 480, lineY, { align: 'right', width: 70 })
        lineY += 15
      }

      if (originalInstalaciones > 0) {
        doc
          .text('Instalación:', 330, lineY)
          .text(`$${originalInstalaciones.toLocaleString('es-CL')}`, 480, lineY, {
            align: 'right',
            width: 70
          })
        lineY += 15
      }

      if (originalMateriales > 0) {
        doc
          .text('Materiales:', 330, lineY)
          .text(`$${originalMateriales.toLocaleString('es-CL')}`, 480, lineY, {
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
        .text(`$${subtotalBruto.toLocaleString('es-CL')}`, 480, lineY, {
          align: 'right',
          width: 70
        })

      lineY += 15

      if (totalDescuentoAbsoluto > 0) {
        doc
          .fillColor('#dc2626')
          .font('Helvetica')
          .text(`Descuento Total:`, 330, lineY)
          .text(`-$${totalDescuentoAbsoluto.toLocaleString('es-CL')}`, 480, lineY, {
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
      // ⭐ SECCIÓN: OBSERVACIONES
      // ============================================
      let obsY = Math.max(doc.y + 20, lineY + 35)
      const obsHeight = 70

      if (cotizacion.notas && cotizacion.notas.trim() !== '') {
        const textOptions = {
          width: 492,
          align: 'justify',
          lineGap: 2
        }

        doc.fontSize(8).font('Helvetica')
        const calculatedHeight = doc.heightOfString(cotizacion.notas, textOptions)
        const padding = 20
        const obsHeightTotal = calculatedHeight + padding

        // Verificar espacio (si no cabe y no estamos al inicio, nueva página)
        if (obsY + obsHeightTotal > 710 && obsY > 100) {
          doc.addPage()
          obsY = 60
        }

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e3a8a')
          .text('OBSERVACIONES', 50, obsY)

        obsY += 18

        // Recuadro dinámico
        doc
          .rect(50, obsY, 512, Math.min(obsHeightTotal, 650 - obsY)) // Limitar al final de página
          .fillAndStroke('#f9fafb', '#e5e7eb')

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#374151')
          .text(cotizacion.notas, 60, obsY + 10, textOptions)
      }

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

export default {
  generarPDFCotizacion
}