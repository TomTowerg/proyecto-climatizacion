import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decryptSensitiveFields } from '../utils/encryption.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ⭐ COLORES PROFESIONALES KMTS
const COLORES = {
  azulOscuro: '#1E3A8A',    // Azul corporativo
  azulClaro: '#3B82F6',      // Azul brillante
  gris: '#64748B',           // Gris medio
  grisCLaro: '#F9FAFB',      // Gris muy claro
  texto: '#1F2937',          // Texto principal
  textoSecundario: '#6B7280', // Texto secundario
  linea: '#E5E7EB',          // Líneas divisorias
  verde: '#10B981',          // Estado completado
  amarillo: '#F59E0B',       // Estado pendiente
  rojo: '#EF4444'            // Urgente
}

export const generarPDFOrdenTrabajo = async (orden) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Generando PDF profesional de orden #${orden.id}...`)

      // Validar datos mínimos
      if (!orden.cliente) {
        throw new Error('La orden debe tener un cliente asociado')
      }

      // Descifrar datos del cliente
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
        console.log('⚠️  Error al descifrar:', error.message)
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

      // ============================================
      // LOGO Y ENCABEZADO
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
            doc.image(logoPath, 50, 45, { width: 70, height: 70 })
            console.log('✅ Logo cargado')
            logoLoaded = true
            break
          } catch (error) {
            console.log('❌ Error al cargar logo:', error.message)
          }
        }
      }

      if (!logoLoaded) {
        doc.fontSize(9)
           .fillColor(COLORES.azulOscuro)
           .font('Helvetica-Bold')
           .text('KMTS', 50, 50)
           .text('POWERTECH', 50, 62)
      }

      // Título principal
      doc.fontSize(26)
         .fillColor(COLORES.azulOscuro)
         .font('Helvetica-Bold')
         .text('ORDEN DE TRABAJO', 140, 55, { align: 'center', width: 332 })

      // Número y fecha
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(COLORES.textoSecundario)
         .text(
           `N° ${orden.id.toString().padStart(6, '0')}  |  Fecha: ${new Date(orden.createdAt || Date.now()).toLocaleDateString('es-CL')}`,
           140,
           doc.y + 5,
           { align: 'center', width: 332 }
         )

      // ============================================
      // EMPRESA Y CLIENTE (DOS COLUMNAS)
      // ============================================
      const dataY = 115

      // EMPRESA (Izquierda)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('DATOS DE LA EMPRESA', 50, dataY)

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(COLORES.texto)
         .text('KMTS POWERTECH SPA', 50, dataY + 15)
         .fontSize(8)
         .font('Helvetica')
         .fillColor(COLORES.textoSecundario)
         .text('RUT: 78.163.187-6', 50, dataY + 28)
         .text('Teléfono: +56 9 5461 0454', 50, dataY + 40)
         .text('Email: kmtspowertech@gmail.com', 50, dataY + 52)

      // CLIENTE (Derecha)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('DATOS DEL CLIENTE', 320, dataY)

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(COLORES.texto)
         .text(clienteDescifrado.nombre || 'Cliente', 320, dataY + 15)

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(COLORES.textoSecundario)

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

      // Línea divisoria
      doc.strokeColor(COLORES.azulOscuro)
         .lineWidth(2)
         .moveTo(50, dataY + 70)
         .lineTo(562, dataY + 70)
         .stroke()

      // ============================================
      // INFORMACIÓN DEL SERVICIO
      // ============================================
      let yPos = dataY + 90

      // Dirección
      const direccion = orden.notas?.includes('Dirección:') 
        ? orden.notas.split('Dirección:')[1]?.trim() 
        : clienteDescifrado.direccion || 'No especificada'

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('DIRECCIÓN DEL SERVICIO', 50, yPos)
         .fontSize(8)
         .font('Helvetica')
         .fillColor(COLORES.textoSecundario)
         .text(direccion, 50, yPos + 15, { width: 500 })

      yPos += 40

      // Tipo de servicio y estado en línea
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('TIPO DE SERVICIO', 50, yPos)

      const tipoTexto = {
        instalacion: 'INSTALACIÓN',
        mantencion: 'MANTENCIÓN',
        reparacion: 'REPARACIÓN'
      }[orden.tipo] || 'SERVICIO'

      doc.fontSize(9)
         .fillColor(COLORES.texto)
         .text(tipoTexto, 50, yPos + 15)

      // Estado
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('ESTADO', 320, yPos)

      const estadoColor = {
        pendiente: COLORES.amarillo,
        en_proceso: COLORES.azulClaro,
        completado: COLORES.verde,
        completada: COLORES.verde
      }[orden.estado] || COLORES.texto

      const estadoTexto = {
        pendiente: 'PENDIENTE',
        en_proceso: 'EN PROCESO',
        completado: 'COMPLETADO',
        completada: 'COMPLETADO'
      }[orden.estado] || 'PENDIENTE'

      doc.fontSize(9)
         .fillColor(estadoColor)
         .font('Helvetica-Bold')
         .text(estadoTexto, 320, yPos + 15)

      yPos += 45

      // ============================================
      // DETALLE DEL EQUIPO (SI EXISTE)
      // ============================================
      if (orden.equipo) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(COLORES.azulOscuro)
           .text('DETALLE DEL EQUIPO', 50, yPos)

        yPos += 18

        // Cuadro con fondo gris
        doc.rect(50, yPos, 512, 65)
           .fillAndStroke(COLORES.grisCLaro, COLORES.linea)

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(COLORES.texto)
           .text(`${orden.equipo.marca} ${orden.equipo.modelo}`, 60, yPos + 8)
           .fontSize(8)
           .font('Helvetica')
           .fillColor(COLORES.textoSecundario)
           .text(`Tipo: ${orden.equipo.tipo}`, 60, yPos + 25)
           .text(`Capacidad: ${orden.equipo.capacidad}`, 60, yPos + 39)
           .text(`N° Serie: ${orden.equipo.numeroSerie}`, 60, yPos + 53)

        yPos += 75
      }

      // ============================================
      // DESCRIPCIÓN DEL TRABAJO
      // ============================================
      const descripcion = orden.notas || orden.descripcion || orden.trabajoRealizado

      if (descripcion) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(COLORES.azulOscuro)
           .text('DESCRIPCIÓN DEL TRABAJO', 50, yPos)

        yPos += 18

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(COLORES.texto)
           .text(descripcion, 50, yPos, { width: 512, align: 'justify' })

        yPos += Math.max(60, doc.heightOfString(descripcion, { width: 512 }) + 20)
      }

      // ============================================
      // INFORMACIÓN ADICIONAL
      // ============================================
      if (yPos > 600) {
        doc.addPage()
        yPos = 60
      }

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(COLORES.azulOscuro)
         .text('INFORMACIÓN DEL SERVICIO', 50, yPos)

      yPos += 20

      const colIzq = 50
      const colDer = 320

      // Técnico
      doc.fontSize(8)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text('Técnico:', colIzq, yPos)
      
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(orden.tecnico || 'Por asignar', colIzq + 80, yPos)

      // Urgencia
      const urgencia = orden.urgencia || orden.prioridad || 'media'
      const urgenciaColor = {
        baja: COLORES.verde,
        media: COLORES.amarillo,
        alta: COLORES.rojo,
        critica: COLORES.rojo
      }[urgencia] || COLORES.texto

      doc.fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text('Urgencia:', colDer, yPos)
      
      doc.fillColor(urgenciaColor)
         .font('Helvetica-Bold')
         .text(urgencia.toUpperCase(), colDer + 80, yPos)

      yPos += 20

      // Fecha programada
      const fechaOrden = orden.fecha || orden.fechaInicio || orden.createdAt
      doc.fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text('Fecha Programada:', colIzq, yPos)
      
      doc.fillColor(COLORES.texto)
         .font('Helvetica-Bold')
         .text(new Date(fechaOrden).toLocaleDateString('es-CL'), colIzq + 80, yPos)

      yPos += 35

      // ============================================
      // COSTOS (SI EXISTEN)
      // ============================================
      if (orden.costoTotal || orden.costoManoObra || orden.costoMateriales) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(COLORES.azulOscuro)
           .text('DESGLOSE DE COSTOS', 320, yPos)

        yPos += 18

        const costoBoxHeight = 
          (orden.costoManoObra ? 20 : 0) +
          (orden.costoMateriales ? 20 : 0) +
          (orden.costoTotal ? 40 : 0) + 20

        doc.rect(320, yPos, 242, costoBoxHeight)
           .fillAndStroke('#ffffff', COLORES.linea)

        let costoY = yPos + 10

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor(COLORES.textoSecundario)

        if (orden.costoManoObra) {
          doc.text('Mano de Obra:', 330, costoY)
             .text(`$${orden.costoManoObra.toLocaleString('es-CL')}`, 480, costoY, {
               align: 'right',
               width: 70
             })
          costoY += 20
        }

        if (orden.costoMateriales) {
          doc.text('Materiales:', 330, costoY)
             .text(`$${orden.costoMateriales.toLocaleString('es-CL')}`, 480, costoY, {
               align: 'right',
               width: 70
             })
          costoY += 20
        }

        if (orden.costoTotal) {
          costoY += 5
          doc.strokeColor(COLORES.azulOscuro)
             .lineWidth(2)
             .moveTo(330, costoY)
             .lineTo(552, costoY)
             .stroke()
          
          costoY += 10

          doc.fontSize(13)
             .font('Helvetica-Bold')
             .fillColor(COLORES.azulOscuro)
             .text('TOTAL:', 330, costoY)
             .text(`$${orden.costoTotal.toLocaleString('es-CL')}`, 450, costoY, {
               align: 'right',
               width: 100
             })
        }

        yPos += costoBoxHeight + 20
      }

      // ============================================
      // SECCIÓN DE FIRMAS
      // ============================================
      if (yPos > 600) {
        doc.addPage()
        yPos = 60
      }

      yPos += 30

      // Línea divisoria
      doc.moveTo(50, yPos)
         .lineTo(562, yPos)
         .strokeColor(COLORES.linea)
         .lineWidth(1)
         .stroke()

      yPos += 30

      doc.fontSize(14)
         .fillColor(COLORES.azulOscuro)
         .font('Helvetica-Bold')
         .text('FIRMAS Y CONFORMIDAD', 50, yPos)

      yPos += 40

      const firmaCol1 = 80
      const firmaCol2 = 350

      // FIRMA DEL TÉCNICO
      doc.fontSize(10)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica-Bold')
         .text('TÉCNICO', firmaCol1, yPos, { align: 'center', width: 150 })

      // Línea para firma
      doc.moveTo(firmaCol1, yPos + 65)
         .lineTo(firmaCol1 + 150, yPos + 65)
         .strokeColor(COLORES.textoSecundario)
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text('Firma del Técnico', firmaCol1, yPos + 75, { align: 'center', width: 150 })
      
      doc.text(orden.tecnico || 'Por asignar', firmaCol1, yPos + 90, { align: 'center', width: 150 })

      // FIRMA DEL CLIENTE
      doc.fontSize(10)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica-Bold')
         .text('CLIENTE', firmaCol2, yPos, { align: 'center', width: 150 })

      doc.moveTo(firmaCol2, yPos + 65)
         .lineTo(firmaCol2 + 150, yPos + 65)
         .strokeColor(COLORES.textoSecundario)
         .lineWidth(1)
         .stroke()

      doc.fontSize(9)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text('Firma del Cliente', firmaCol2, yPos + 75, { align: 'center', width: 150 })
      
      doc.text(clienteDescifrado.nombre || 'Cliente', firmaCol2, yPos + 90, { align: 'center', width: 150 })

      yPos += 120

      // Texto de conformidad
      doc.fontSize(8)
         .fillColor(COLORES.textoSecundario)
         .font('Helvetica')
         .text(
           'El cliente declara haber recibido el servicio conforme y autoriza el trabajo realizado.',
           50,
           yPos,
           { width: 512, align: 'center' }
         )

      // ============================================
      // PIE DE PÁGINA
      // ============================================
      const bottomY = 730

      doc.moveTo(50, bottomY)
         .lineTo(562, bottomY)
         .strokeColor(COLORES.linea)
         .lineWidth(1)
         .stroke()

      doc.fontSize(8)
         .fillColor(COLORES.textoSecundario)
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
      console.error('❌ Error al generar PDF:', error)
      console.error('Stack:', error.stack)
      reject(error)
    }
  })
}

export default { generarPDFOrdenTrabajo }