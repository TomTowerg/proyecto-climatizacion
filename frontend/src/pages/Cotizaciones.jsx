import { useState, useEffect, useCallback, useRef } from 'react'
import RutInput from '../components/RutInput'
import PhoneInput from '../components/PhoneInput'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, Filter, X, FileText, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import Pagination from '../components/Pagination'

import VisorPDF from '../components/VisorPDF'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { isAuthenticated } from '../services/authService'
import {
  getCotizaciones,
  createCotizacion,
  updateCotizacion,
  deleteCotizacion,
  aprobarCotizacion,
  rechazarCotizacion
} from '../services/cotizacionService'
import { getMateriales } from '../services/materialInventarioService'
import { getTiposInstalacion, createTipoInstalacion } from '../services/tipoInstalacionService'
import { getCatalogoServicios, createCatalogoServicio } from '../services/catalogoServicioService'
import { getClientes, createCliente } from '../services/clienteService'
import { getInventario } from '../services/inventarioService'
import { getEquiposByCliente, createEquipo } from '../services/equipoService'
import '../styles/tablas-compactas.css'

function Cotizaciones() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [inventarioDisponible, setInventarioDisponible] = useState([])
  const [equiposCliente, setEquiposCliente] = useState([])
  const [equiposClienteIds, setEquiposClienteIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [pdfCotizacionId, setPdfCotizacionId] = useState(null)
  const [cotizacionToApprove, setCotizacionToApprove] = useState(null)
  const [approving, setApproving] = useState(false)
  const [fechaInstalacion, setFechaInstalacion] = useState(new Date().toISOString().split('T')[0])
  const [showClientModal, setShowClientModal] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [showEquipoModal, setShowEquipoModal] = useState(false)
  const [creatingEquipo, setCreatingEquipo] = useState(false)
  const [newEquipoData, setNewEquipoData] = useState({
    tipo: 'Split',
    marca: '',
    modelo: '',
    capacidad: '',
    tipoGas: '',
    numeroSerie: ''
  })
  const [materialesInventario, setMaterialesInventario] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState(null)
  const ITEMS_PER_PAGE = 20
  const isFirstRender = useRef(true)
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: ''
  })
  const [editingCotizacion, setEditingCotizacion] = useState(null)
  const [filters, setFilters] = useState({
    estado: '',
    tipo: ''
  })
  const [formData, setFormData] = useState({
    tipo: 'instalacion',
    clienteId: '',
    inventarioId: '',
    descuento: 0,
    notas: '',
    agente: '',
    direccionInstalacion: '',
    estado: 'pendiente'
  })

  // Estados para materiales
  const [materiales, setMateriales] = useState([])
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    cantidad: 1,
    unidad: 'unidades',
    precioUnitario: 0
  })

  // Estados para múltiples equipos
  const [equipos, setEquipos] = useState([])
  const [nuevoEquipo, setNuevoEquipo] = useState({
    inventarioId: '',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
    descuentoMonto: 0
  })

  // ⭐ NUEVO: Estado para búsqueda de equipos
  const [busquedaEquipo, setBusquedaEquipo] = useState('')

  // Estados para instalaciones
  const [instalaciones, setInstalaciones] = useState([])
  const [tiposInstalacion, setTiposInstalacion] = useState([])
  const [nuevaInstalacion, setNuevaInstalacion] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    descuento: 0,
    descuentoMonto: 0
  })

  // Estados para mantenciones (costos de servicio dinámicos)
  const [mantenciones, setMantenciones] = useState([])
  const [nuevaMantencion, setNuevaMantencion] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    descuento: 0,
    descuentoMonto: 0
  })
  const [catalogoServicios, setCatalogoServicios] = useState([])
  const [guardarEnCatalogo, setGuardarEnCatalogo] = useState(false)

  // Estado para la dirección personalizada de instalación
  const [isCustomAddress, setIsCustomAddress] = useState(false)

  const fetchData = useCallback(async (page, search) => {
    try {
      setLoading(true)
      const [cotizacionesData, clientesData, inventarioData, tiposInstalacionData, catalogoData] = await Promise.all([
        getCotizaciones({ page, limit: ITEMS_PER_PAGE, search: search || undefined }),
        getClientes(),  // Sin paginar: dropdown
        getInventario(),  // Sin paginar: dropdown
        getTiposInstalacion().catch(() => []),
        getCatalogoServicios().catch(() => [])
      ])

      // Manejar respuesta paginada
      if (cotizacionesData.pagination) {
        setCotizaciones(cotizacionesData.data)
        setPaginationInfo(cotizacionesData.pagination)
      } else {
        setCotizaciones(cotizacionesData)
        setPaginationInfo(null)
      }

      setClientes(clientesData)
      setInventario(inventarioData)

      const disponible = inventarioData.filter(item =>
        item.stock > 0 && item.estado === 'disponible'
      )
      setInventarioDisponible(disponible)
      setTiposInstalacion(tiposInstalacionData)
      setCatalogoServicios(catalogoData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData(currentPage, debouncedSearch)
  }, [navigate, fetchData, currentPage, debouncedSearch])

  // Debounce del término de búsqueda (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Cuando cambia la búsqueda debounced, resetear a página 1
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setCurrentPage(1)
  }, [debouncedSearch])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (formData.clienteId && (formData.tipo === 'mantencion' || formData.tipo === 'reparacion' || formData.tipo === 'visita_tecnica' || formData.tipo === 'desinstalacion')) {
      fetchEquiposCliente(formData.clienteId)
    }
  }, [formData.clienteId, formData.tipo])

  useEffect(() => {
    const fetchMaterialesInventario = async () => {
      try {
        const materialesData = await getMateriales()
        // Filtrar solo materiales activos y con stock
        const materialesActivos = materialesData.filter(m => m.activo)
        setMaterialesInventario(materialesActivos)
      } catch (error) {
        console.error('Error al cargar materiales del inventario:', error)
      }
    }
    fetchMaterialesInventario()
  }, [])

  const fetchEquiposCliente = async (clienteId) => {
    try {
      const equipos = await getEquiposByCliente(clienteId)
      setEquiposCliente(equipos)

      if (equipos.length === 0) {
        toast.info('Este cliente no tiene equipos registrados')
      }
    } catch (error) {
      console.error('Error al cargar equipos del cliente:', error)
      setEquiposCliente([])
    }
  }

  const calcularTotalMantenciones = () => {
    return mantenciones.reduce((acc, m) => acc + m.subtotal, 0)
  }

  const calcularTotal = () => {
    const totalEquipos = formData.tipo === 'instalacion' ? calcularTotalEquipos() : 0
    const totalMantenciones = formData.tipo !== 'instalacion' ? calcularTotalMantenciones() : 0
    const totalMateriales = calcularTotalMateriales()
    const totalInstalaciones = calcularTotalInstalaciones()
    const descuento = parseFloat(formData.descuento) || 0
    const subtotal = totalEquipos + totalMantenciones + totalMateriales + totalInstalaciones
    const montoDescuento = subtotal * (descuento / 100)
    return subtotal - montoDescuento
  }

  const calcularTotalMateriales = () => {
    return materiales.reduce((acc, m) => acc + m.subtotal, 0)
  }

  const calcularTotalEquipos = () => {
    return equipos.reduce((acc, eq) => acc + eq.subtotal, 0)
  }

  const calcularTotalInstalaciones = () => {
    return instalaciones.reduce((acc, inst) => acc + inst.subtotal, 0)
  }

  // ⭐ NUEVO: Filtrar y ordenar inventario disponible
  const inventarioFiltrado = inventarioDisponible
    .filter(item => {
      if (!busquedaEquipo.trim()) return true

      const searchTerm = busquedaEquipo.toLowerCase()
      const marca = item.marca.toLowerCase()
      const modelo = item.modelo.toLowerCase()
      const capacidad = item.capacidadBTU.toString()

      return marca.includes(searchTerm) ||
        modelo.includes(searchTerm) ||
        capacidad.includes(searchTerm)
    })
    .sort((a, b) => {
      // Ordenar por marca, luego por capacidad
      if (a.marca !== b.marca) {
        return a.marca.localeCompare(b.marca)
      }
      return a.capacidadBTU - b.capacidadBTU
    })

  const agregarMaterial = () => {
    // Validación
    if (!nuevoMaterial.nombre) {
      toast.error('Selecciona un material')
      return
    }
    if (!nuevoMaterial.cantidad || nuevoMaterial.cantidad <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    if (!nuevoMaterial.precioUnitario || nuevoMaterial.precioUnitario <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    const precioBaseMaterial = nuevoMaterial.cantidad * nuevoMaterial.precioUnitario
    const descuentoMatPct = parseFloat(nuevoMaterial.descuento) || 0
    const descuentoMatMonto = precioBaseMaterial * (descuentoMatPct / 100)

    const materialConSubtotal = {
      ...nuevoMaterial,
      descuento: descuentoMatPct,
      subtotal: precioBaseMaterial - descuentoMatMonto
    }

    setMateriales([...materiales, materialConSubtotal])

    // Resetear formulario
    setNuevoMaterial({
      materialInventarioId: null,
      nombre: '',
      cantidad: 1,
      unidad: 'unidades',
      precioUnitario: 0,
      descuento: 0,
      descuentoMonto: 0
    })

    toast.success('Material agregado')
  }

  const handleMaterialSelect = (e) => {
    const materialId = parseInt(e.target.value)

    if (!materialId) {
      setNuevoMaterial({
        materialInventarioId: null,
        nombre: '',
        cantidad: 1,
        unidad: 'unidades',
        precioUnitario: 0,
        descuento: 0,
        descuentoMonto: 0
      })
      return
    }

    const materialSeleccionado = materialesInventario.find(m => m.id === materialId)

    if (materialSeleccionado) {
      setNuevoMaterial({
        materialInventarioId: materialSeleccionado.id,
        nombre: materialSeleccionado.nombre,
        cantidad: 1,
        unidad: materialSeleccionado.unidad,
        precioUnitario: materialSeleccionado.precioConIVA,
        descuento: 0,
        descuentoMonto: 0
      })
    }
  }

  const eliminarMaterial = (index) => {
    setMateriales(materiales.filter((_, i) => i !== index))
    toast.success('Material eliminado')
  }

  const agregarEquipo = () => {
    if (!nuevoEquipo.inventarioId) {
      toast.error('Selecciona un equipo')
      return
    }
    if (nuevoEquipo.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    const equipoSeleccionado = inventario.find(e => e.id === parseInt(nuevoEquipo.inventarioId))

    if (!equipoSeleccionado) {
      toast.error('Equipo no encontrado')
      return
    }

    // Verificar stock disponible
    const cantidadYaAgregada = equipos
      .filter(eq => eq.inventarioId === parseInt(nuevoEquipo.inventarioId))
      .reduce((total, eq) => total + eq.cantidad, 0)

    const stockDisponible = equipoSeleccionado.stock - cantidadYaAgregada

    if (nuevoEquipo.cantidad > stockDisponible) {
      toast.error(`Solo hay ${stockDisponible} unidades disponibles en stock`)
      return
    }

    const precioUnitEq = nuevoEquipo.precioUnitario || equipoSeleccionado.precioCliente
    const precioBaseEq = nuevoEquipo.cantidad * precioUnitEq
    const descuentoEqPct = parseFloat(nuevoEquipo.descuento) || 0
    const descuentoEqMonto = precioBaseEq * (descuentoEqPct / 100)

    const equipoConSubtotal = {
      inventarioId: parseInt(nuevoEquipo.inventarioId),
      marca: equipoSeleccionado.marca,
      modelo: equipoSeleccionado.modelo,
      capacidadBTU: equipoSeleccionado.capacidadBTU,
      cantidad: nuevoEquipo.cantidad,
      precioUnitario: precioUnitEq,
      descuento: descuentoEqPct,
      subtotal: precioBaseEq - descuentoEqMonto
    }

    setEquipos([...equipos, equipoConSubtotal])

    setNuevoEquipo({
      inventarioId: '',
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
      descuentoMonto: 0
    })

    toast.success('Equipo agregado')
  }

  const eliminarEquipo = (index) => {
    setEquipos(equipos.filter((_, i) => i !== index))
    toast.success('Equipo eliminado')
  }

  const agregarInstalacion = () => {
    if (!nuevaInstalacion.nombre.trim()) {
      toast.error('Ingresa un nombre para la instalación')
      return
    }
    if (!nuevaInstalacion.precio || nuevaInstalacion.precio <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    const descuentoPct = parseFloat(nuevaInstalacion.descuento) || 0
    const precio = parseFloat(nuevaInstalacion.precio)
    const montoDescuento = precio * (descuentoPct / 100)
    const subtotal = precio - montoDescuento

    setInstalaciones([...instalaciones, {
      ...nuevaInstalacion,
      precio,
      descuento: descuentoPct,
      subtotal
    }])

    setNuevaInstalacion({
      nombre: '',
      descripcion: '',
      precio: 0,
      descuento: 0,
      descuentoMonto: 0
    })

    toast.success('Instalación agregada')
  }

  const eliminarInstalacion = (index) => {
    setInstalaciones(instalaciones.filter((_, i) => i !== index))
    toast.success('Instalación eliminada')
  }

  const agregarMantencion = async () => {
    if (!nuevaMantencion.nombre.trim()) {
      toast.error('Ingresa un nombre para el costo')
      return
    }
    if (!nuevaMantencion.precio || nuevaMantencion.precio <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }
    const descuentoPct = parseFloat(nuevaMantencion.descuento) || 0
    const precio = parseFloat(nuevaMantencion.precio)
    const montoDescuento = precio * (descuentoPct / 100)
    setMantenciones([...mantenciones, {
      ...nuevaMantencion,
      precio,
      descuento: descuentoPct,
      subtotal: precio - montoDescuento
    }])

    // Guardar en catálogo si el checkbox está marcado
    if (guardarEnCatalogo) {
      try {
        const nuevoItem = await createCatalogoServicio({
          categoria: formData.tipo,
          nombre: nuevaMantencion.nombre.trim(),
          precio
        })
        setCatalogoServicios(prev => [...prev, nuevoItem])
        toast.success(`"${nuevoItem.nombre}" guardado en el catálogo`)
      } catch (err) {
        console.error('Error al guardar en catálogo:', err)
        toast.error('No se pudo guardar en el catálogo')
      }
    }

    setNuevaMantencion({ nombre: '', descripcion: '', precio: 0, descuento: 0, descuentoMonto: 0 })
    setGuardarEnCatalogo(false)
    toast.success('Costo agregado')
  }

  const eliminarMantencion = (index) => {
    setMantenciones(mantenciones.filter((_, i) => i !== index))
  }

  // Seleccionar tipo de instalación del catálogo
  const handleTipoInstalacionSelect = (tipoId) => {
    if (!tipoId) {
      setNuevaInstalacion({ nombre: '', descripcion: '', precio: 0, descuento: 0, descuentoMonto: 0 })
      return
    }
    const tipo = tiposInstalacion.find(t => t.id === parseInt(tipoId))
    if (tipo) {
      setNuevaInstalacion({
        nombre: tipo.nombre,
        descripcion: tipo.descripcion || '',
        precio: tipo.precio,
        descuento: 0,
        descuentoMonto: 0
      })
    }
  }

  // Guardar tipo de instalación en el catálogo
  const guardarTipoInstalacion = async () => {
    if (!nuevaInstalacion.nombre.trim() || nuevaInstalacion.precio <= 0) {
      toast.error('Ingresa nombre y precio antes de guardar')
      return
    }
    try {
      const nuevoTipo = await createTipoInstalacion({
        nombre: nuevaInstalacion.nombre.trim(),
        descripcion: nuevaInstalacion.descripcion?.trim() || null,
        precio: parseFloat(nuevaInstalacion.precio)
      })
      setTiposInstalacion([...tiposInstalacion, nuevoTipo])
      toast.success(`Tipo "${nuevoTipo.nombre}" guardado en el catálogo`)
    } catch (error) {
      console.error('Error al guardar tipo:', error)
      toast.error('Error al guardar el tipo de instalación')
    }
  }

  // Descuento bidireccional: cambiar monto → calcula %
  const handleDescuentoMontoChange = (monto) => {
    const precio = parseFloat(nuevaInstalacion.precio) || 0
    const montoNum = parseFloat(monto) || 0
    const porcentaje = precio > 0 ? (montoNum / precio) * 100 : 0
    setNuevaInstalacion(prev => ({
      ...prev,
      descuentoMonto: montoNum,
      descuento: Math.round(porcentaje * 100) / 100
    }))
  }

  // Descuento bidireccional: cambiar % → calcula monto
  const handleDescuentoPctChange = (pct) => {
    const precio = parseFloat(nuevaInstalacion.precio) || 0
    const pctNum = parseFloat(pct) || 0
    const monto = precio * (pctNum / 100)
    setNuevaInstalacion(prev => ({
      ...prev,
      descuento: pctNum,
      descuentoMonto: Math.round(monto)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Calcular totales desde arrays dinámicos
      const totalEquipos = formData.tipo === 'instalacion' ? calcularTotalEquipos() : 0
      const totalMantenciones = formData.tipo !== 'instalacion' ? calcularTotalMantenciones() : 0
      const precioOfertadoCalc = totalEquipos + totalMantenciones
      const totalMateriales = calcularTotalMateriales()
      const totalInstalacionesCalc = calcularTotalInstalaciones()
      const descuento = parseFloat(formData.descuento) || 0
      const subtotal = precioOfertadoCalc + totalMateriales + totalInstalacionesCalc
      const montoDescuento = subtotal * (descuento / 100)
      const precioFinal = subtotal - montoDescuento

      // ⭐ DATOS A ENVIAR (con TODOS los campos requeridos)
      const dataToSend = {
        tipo: formData.tipo,
        clienteId: parseInt(formData.clienteId),
        precioOfertado: precioOfertadoCalc,
        costoInstalacion: totalInstalacionesCalc,
        costoMaterial: totalMateriales,
        subtotal: subtotal,
        descuento: descuento,
        precioFinal: precioFinal,
        notas: formData.notas,
        agente: formData.agente || JSON.parse(localStorage.getItem('user'))?.name || 'Administrador',
        direccionInstalacion: formData.direccionInstalacion,
        materiales: materiales.map(mat => ({
          nombre: mat.nombre,
          cantidad: parseFloat(mat.cantidad),
          unidad: mat.unidad,
          precioUnitario: parseFloat(mat.precioUnitario),
          subtotal: parseFloat(mat.subtotal),
          descuento: parseFloat(mat.descuento || 0),
          descripcion: mat.descripcion || ''
        })),
        instalaciones: instalaciones.map(inst => ({
          nombre: inst.nombre,
          descripcion: inst.descripcion || '',
          precio: parseFloat(inst.precio),
          descuento: parseFloat(inst.descuento || 0),
          subtotal: parseFloat(inst.subtotal)
        })),
        mantenciones: mantenciones.map(m => ({
          nombre: m.nombre,
          descripcion: m.descripcion || '',
          precio: parseFloat(m.precio),
          descuento: parseFloat(m.descuento || 0),
          subtotal: parseFloat(m.subtotal)
        }))
      }

      // ⭐ AGREGAR EQUIPOS SEGÚN TIPO
      if (formData.tipo === 'instalacion') {
        if (equipos.length > 0) {
          // Múltiples equipos
          dataToSend.equipos = equipos.map(eq => ({
            inventarioId: parseInt(eq.inventarioId),
            cantidad: parseInt(eq.cantidad),
            precioUnitario: parseFloat(eq.precioUnitario),
            subtotal: parseFloat(eq.subtotal)
          }))
        } else if (formData.inventarioId) {
          // Sistema antiguo - un solo equipo
          dataToSend.inventarioId = parseInt(formData.inventarioId)
        }
      } else {
        // Mantención/Reparación - usa equipo existente del cliente
        if (equiposClienteIds.length > 0) {
          dataToSend.equiposClienteIds = equiposClienteIds
        }
      }

      console.log('📤 Enviando cotización:', dataToSend)

      // ⭐ GUARDAR
      if (editingCotizacion) {
        await updateCotizacion(editingCotizacion.id, {
          ...dataToSend,
          estado: formData.estado
        })
        toast.success('Cotización actualizada exitosamente')
      } else {
        await createCotizacion(dataToSend)
        toast.success('Cotización creada exitosamente')
      }

      fetchData()
      handleCloseModal()

    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.details ||
        'Error al guardar la cotización'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (cotizacion) => {
    setEditingCotizacion(cotizacion)
    setFormData({
      tipo: cotizacion.tipo || 'instalacion',
      clienteId: cotizacion.clienteId,
      inventarioId: cotizacion.inventarioId || '',
      descuento: cotizacion.descuento,
      notas: cotizacion.notas || '',
      agente: cotizacion.agente || '',
      direccionInstalacion: cotizacion.direccionInstalacion || '',
      estado: cotizacion.estado
    })

    if (cotizacion.materiales && cotizacion.materiales.length > 0) {
      setMateriales(cotizacion.materiales)
    }

    if (cotizacion.equipos && cotizacion.equipos.length > 0) {
      setEquipos(cotizacion.equipos)
    }

    if (cotizacion.instalaciones && cotizacion.instalaciones.length > 0) {
      setInstalaciones(cotizacion.instalaciones)
    }

    if (cotizacion.mantenciones && cotizacion.mantenciones.length > 0) {
      setMantenciones(cotizacion.mantenciones)
    }
    if (cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0) {
      setEquiposClienteIds(cotizacion.equiposCliente.map(e => e.id))
    }

    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cotización?')) {
      return
    }

    try {
      await deleteCotizacion(id)
      toast.success('Cotización eliminada exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar la cotización'
      toast.error(errorMessage)
    }
  }

  const handleAprobar = (cotizacion) => {
    setCotizacionToApprove(cotizacion)
    setFechaInstalacion(new Date().toISOString().split('T')[0]) // Reset fecha al abrir
    setShowApproveModal(true)
  }

  const confirmarAprobacion = async () => {
    if (!cotizacionToApprove) return

    try {
      setApproving(true)

      const loadingToast = toast.loading('Aprobando cotización...')

      const resultado = await aprobarCotizacion(cotizacionToApprove.id, {
        fechaInstalacion
      })

      toast.dismiss(loadingToast)

      const mensajesTipo = {
        instalacion: 'Equipo registrado',
        mantencion: 'Mantención programada',
        reparacion: 'Reparación programada',
        visita_tecnica: 'Visita técnica programada',
        desinstalacion: 'Desinstalación programada'
      }

      toast.success(
        <div>
          <p className="font-bold">Cotización Aprobada</p>
          <p className="text-sm mt-1">{mensajesTipo[cotizacionToApprove.tipo]}: #{resultado.equipo?.id || resultado.ordenTrabajo?.id}</p>
          <p className="text-sm">Orden de Trabajo: #{resultado.ordenTrabajo?.id}</p>
        </div>,
        { duration: 5000 }
      )

      setShowApproveModal(false)
      setCotizacionToApprove(null)
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error.response?.data?.detalle || error.response?.data?.error || 'Error al aprobar la cotización'
      toast.error(errorMessage)
    } finally {
      setApproving(false)
    }
  }

  const handleRechazar = async (cotizacion) => {
    const motivo = window.prompt('¿Motivo del rechazo?')
    if (motivo === null) return

    try {
      await rechazarCotizacion(cotizacion.id, motivo)
      toast.success('Cotización rechazada')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar la cotización')
    }
  }

  const handleVerPDF = (cotizacionId) => {
    setPdfCotizacionId(cotizacionId)
    setShowPDFModal(true)
  }

  const handleCreateQuickClient = async () => {
    if (!newClientData.nombre.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    setCreatingClient(true)
    try {
      const nuevoCliente = await createCliente(newClientData)

      setClientes(prev => [...prev, nuevoCliente])
      setFormData(prev => ({ ...prev, clienteId: nuevoCliente.id.toString() }))

      setShowClientModal(false)
      setNewClientData({
        nombre: '',
        rut: '',
        email: '',
        telefono: '',
        direccion: ''
      })

      toast.success(`Cliente "${nuevoCliente.nombre}" creado exitosamente`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast.error(error.response?.data?.error || 'Error al crear cliente')
    } finally {
      setCreatingClient(false)
    }
  }

  const handleCreateQuickEquipo = async () => {
    if (!newEquipoData.tipo.trim() || !newEquipoData.capacidad.trim()) {
      toast.error('El tipo y la capacidad del equipo son requeridos')
      return
    }
    if (!formData.clienteId) {
      toast.error('Primero selecciona un cliente')
      return
    }

    setCreatingEquipo(true)
    try {
      const nuevoEquipo = await createEquipo({
        ...newEquipoData,
        clienteId: parseInt(formData.clienteId),
        estado: 'activo'
      })

      // Agregar a la lista local y preseleccionar
      setEquiposCliente(prev => [...prev, nuevoEquipo])
      setEquiposClienteIds(prev => [...prev, nuevoEquipo.id])

      setShowEquipoModal(false)
      setNewEquipoData({ tipo: 'Split', marca: '', modelo: '', capacidad: '', tipoGas: '', numeroSerie: '' })

      toast.success(`Equipo "${nuevoEquipo.marca || nuevoEquipo.tipo} ${nuevoEquipo.modelo || ''}" creado y seleccionado`)
    } catch (error) {
      console.error('Error al crear equipo:', error)
      toast.error(error.response?.data?.error || 'Error al crear equipo')
    } finally {
      setCreatingEquipo(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCotizacion(null)
    setEquiposCliente([])
    setFormData({
      tipo: 'instalacion',
      clienteId: '',
      inventarioId: '',
      descuento: 0,
      notas: '',
      agente: '',
      direccionInstalacion: '',
      estado: 'pendiente'
    })
    setMateriales([])
    setNuevoMaterial({
      nombre: '',
      cantidad: 1,
      unidad: 'unidades',
      precioUnitario: 0
    })
    setEquipos([])
    setNuevoEquipo({
      inventarioId: '',
      cantidad: 1,
      precioUnitario: 0
    })
    // ⭐ NUEVO: Limpiar búsqueda
    setBusquedaEquipo('')
    setInstalaciones([])
    setNuevaInstalacion({
      nombre: '',
      descripcion: '',
      precio: 0,
      descuento: 0,
      descuentoMonto: 0
    })
    setEquiposClienteIds([])
    setMantenciones([])
    setNuevaMantencion({ nombre: '', descripcion: '', precio: 0, descuento: 0, descuentoMonto: 0 })
  }

  const clearFilters = () => {
    setFilters({ estado: '', tipo: '' })
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    }
    const labels = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada'
    }
    return (
      <span className={`badge-compacto ${badges[estado]}`}>
        {labels[estado]}
      </span>
    )
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      instalacion: 'bg-blue-100 text-blue-800',
      mantencion: 'bg-purple-100 text-purple-800',
      reparacion: 'bg-orange-100 text-orange-800',
      visita_tecnica: 'bg-teal-100 text-teal-800',
      desinstalacion: 'bg-slate-100 text-slate-800'
    }
    const labels = {
      instalacion: '🔧 Instalación',
      mantencion: '⚙️ Mantención',
      reparacion: '🔨 Reparación',
      visita_tecnica: '🔍 Visita Técnica',
      desinstalacion: '📤 Desinstalación'
    }
    return (
      <span className={`badge-compacto ${badges[tipo] || 'bg-gray-100 text-gray-800'}`}>
        {labels[tipo] || tipo}
      </span>
    )
  }

  // Búsqueda ya viene filtrada del servidor, solo aplicar filtros locales de estado/tipo
  const filteredCotizaciones = cotizaciones.filter(cot => {
    const matchesEstado = !filters.estado || cot.estado === filters.estado
    const matchesTipo = !filters.tipo || cot.tipo === filters.tipo
    return matchesEstado && matchesTipo
  })

  const stats = {
    total: cotizaciones.length,
    pendientes: cotizaciones.filter(c => c.estado === 'pendiente').length,
    aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length,
    rechazadas: cotizaciones.filter(c => c.estado === 'rechazada').length
  }

  if (loading && cotizaciones.length === 0) {
    return <LoadingSkeleton accentColor="purple" rows={8} columns={5} showStats={true} statCards={4} />
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="text-white" size={22} />
                </div>
                Cotizaciones
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestión de presupuestos y servicios • Total: {paginationInfo ? paginationInfo.total : cotizaciones.length}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Nueva Cotización
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Pendiente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>

              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos los tipos</option>
                <option value="instalacion">Instalación</option>
                <option value="mantencion">Mantención</option>
                <option value="reparacion">Reparación</option>
                <option value="visita_tecnica">Visita Técnica</option>
                <option value="desinstalacion">Desinstalación</option>
              </select>

              {(filters.estado || filters.tipo) && (
                <button
                  onClick={clearFilters}
                  className="col-span-2 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tabla-compacta">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">Tipo</th>
                  <th className="text-left">Cliente</th>
                  <th className="text-left">Equipo</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Fecha</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-8">
                      {searchTerm || filters.estado || filters.tipo
                        ? 'No se encontraron resultados'
                        : 'No hay cotizaciones registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredCotizaciones.map((cotizacion) => {
                    // ⭐ NUEVO: Detectar múltiples equipos
                    let producto = 'N/A'

                    if (cotizacion.equipos && cotizacion.equipos.length > 0) {
                      // Múltiples equipos
                      if (cotizacion.equipos.length === 1) {
                        // Un solo equipo en el array
                        const eq = cotizacion.equipos[0]
                        const inv = inventario.find(i => i.id === eq.inventarioId)
                        producto = inv ? `${inv.marca} ${inv.modelo}` : 'Equipo'
                      } else {
                        // Múltiples equipos
                        producto = `${cotizacion.equipos.length} equipos`
                      }
                    } else if (cotizacion.inventario) {
                      // Sistema antiguo - un equipo
                      producto = `${cotizacion.inventario.marca} ${cotizacion.inventario.modelo}`
                    } else if (cotizacion.equipo) {
                      // Mantención/Reparación - equipo singular antiguo
                      producto = `${cotizacion.equipo.marca} ${cotizacion.equipo.modelo}`
                    } else if (cotizacion.equiposCliente && cotizacion.equiposCliente.length > 0) {
                      // Mantención/Reparación/Visita - equipos del cliente (nuevo flujo multi-equipo)
                      producto = cotizacion.equiposCliente
                        .map(e => [e.marca, e.modelo].filter(Boolean).join(' '))
                        .join(', ')
                    }

                    return (
                      <tr key={cotizacion.id} className="hover:bg-purple-50/30 transition-colors border-b border-gray-100">
                        <td className="font-mono">#{cotizacion.id}</td>
                        <td>{getTipoBadge(cotizacion.tipo)}</td>
                        <td>{cotizacion.cliente?.nombre}</td>

                        {/* ⭐ COLUMNA EQUIPO MEJORADA */}
                        <td className="text-sm">
                          <div>
                            {producto}
                            {cotizacion.equipos && cotizacion.equipos.length > 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {cotizacion.equipos.map((eq, idx) => {
                                  const inv = inventario.find(i => i.id === eq.inventarioId)
                                  return inv ? (
                                    <div key={idx}>
                                      • {inv.marca} {inv.modelo} ({eq.cantidad})
                                    </div>
                                  ) : null
                                })}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="text-right font-semibold text-green-600">
                          ${cotizacion.precioFinal.toLocaleString('es-CL')}
                        </td>
                        <td className="text-center">{getEstadoBadge(cotizacion.estado)}</td>
                        <td className="text-center text-sm">
                          {new Date(cotizacion.createdAt).toLocaleDateString('es-CL')}
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleVerPDF(cotizacion.id)}
                              className="btn-accion-compacto text-gray-600 hover:bg-gray-50"
                              title="Ver PDF"
                            >
                              <FileText size={16} />
                            </button>
                            {cotizacion.estado === 'pendiente' && (
                              <>
                                <button
                                  onClick={() => handleAprobar(cotizacion)}
                                  className="btn-accion-compacto text-green-600 hover:bg-green-50"
                                  title="Aprobar"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleRechazar(cotizacion)}
                                  className="btn-accion-compacto text-red-600 hover:bg-red-50"
                                  title="Rechazar"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(cotizacion)}
                              className="btn-accion-compacto text-blue-600 hover:bg-blue-50"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cotizacion.id)}
                              className="btn-accion-compacto text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {paginationInfo && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              limit={paginationInfo.limit}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Mostrando {filteredCotizaciones.length} de {paginationInfo ? paginationInfo.total : cotizaciones.length} cotizaciones
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Servicio */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3">Tipo de Servicio</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['instalacion', 'mantencion', 'reparacion', 'visita_tecnica', 'desinstalacion'].map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${formData.tipo === tipo
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo}
                        checked={formData.tipo === tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="sr-only"
                      />
                      <span className="font-medium">
                        {tipo === 'instalacion' && '🔧 Instalación'}
                        {tipo === 'mantencion' && '⚙️ Mantención'}
                        {tipo === 'reparacion' && '🔨 Reparación'}
                        {tipo === 'visita_tecnica' && '🔍 Visita Técnica'}
                        {tipo === 'desinstalacion' && '📤 Desinstalación'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingCotizacion}
                  >
                    <option value="">Seleccionar...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>

                  {!editingCotizacion && (
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                      title="Crear cliente"
                    >
                      <UserPlus size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* ⭐ SECCIÓN DE EQUIPOS PARA INSTALACIÓN */}
              {formData.tipo === 'instalacion' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    🛒 Equipos a Instalar
                    <span className="text-sm font-normal text-gray-600">
                      ({equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'})
                    </span>
                  </h3>

                  {/* Formulario para agregar equipo */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    {/* Campo de búsqueda */}
                    <div className="mb-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={busquedaEquipo}
                          onChange={(e) => setBusquedaEquipo(e.target.value)}
                          placeholder="🔍 Buscar por marca, modelo o capacidad..."
                          className="w-full px-4 py-2 pl-10 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {busquedaEquipo && (
                          <button
                            type="button"
                            onClick={() => setBusquedaEquipo('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {busquedaEquipo && (
                        <p className="text-xs text-blue-600 mt-1">
                          {inventarioFiltrado.length} {inventarioFiltrado.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Seleccionar Equipo
                        </label>
                        <select
                          value={nuevoEquipo.inventarioId}
                          onChange={(e) => {
                            const inventarioId = e.target.value
                            const equipo = inventario.find(eq => eq.id === parseInt(inventarioId))
                            setNuevoEquipo({
                              inventarioId,
                              cantidad: 1,
                              precioUnitario: equipo?.precioCliente || 0,
                              descuento: 0,
                              descuentoMonto: 0
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"

                        >
                          <option value="">
                            {inventarioFiltrado.length === 0
                              ? 'No hay equipos disponibles'
                              : 'Seleccionar equipo...'}
                          </option>
                          {inventarioFiltrado.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.marca} {item.modelo} ({item.capacidadBTU} BTU) - Stock: {item.stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={nuevoEquipo.cantidad}
                          onChange={(e) => setNuevoEquipo(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unitario
                        </label>
                        <input
                          type="number"
                          value={nuevoEquipo.precioUnitario}
                          onChange={(e) => setNuevoEquipo(prev => ({ ...prev, precioUnitario: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. $</label>
                        <input
                          type="number"
                          value={nuevoEquipo.descuentoMonto}
                          onChange={(e) => {
                            const monto = parseFloat(e.target.value) || 0
                            const precio = (nuevoEquipo.precioUnitario || 0) * (nuevoEquipo.cantidad || 1)
                            const pct = precio > 0 ? (monto / precio) * 100 : 0
                            setNuevoEquipo(prev => ({ ...prev, descuentoMonto: monto, descuento: Math.round(pct * 100) / 100 }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. %</label>
                        <input
                          type="number"
                          value={nuevoEquipo.descuento}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0
                            const precio = (nuevoEquipo.precioUnitario || 0) * (nuevoEquipo.cantidad || 1)
                            const monto = precio * (pct / 100)
                            setNuevoEquipo(prev => ({ ...prev, descuento: pct, descuentoMonto: Math.round(monto) }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={agregarEquipo}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
                          disabled={!nuevoEquipo.inventarioId}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de equipos agregados */}
                  {equipos.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">Equipo</th>
                            <th className="px-4 py-2 text-center">Cantidad</th>
                            <th className="px-4 py-2 text-right">Precio Unit.</th>
                            <th className="px-4 py-2 text-right">Desc. %</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                            <th className="px-4 py-2 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {equipos.map((equipo, index) => (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <span className="font-medium">{equipo.marca} {equipo.modelo}</span>
                                <span className="text-xs text-gray-500 block">
                                  {equipo.capacidadBTU} BTU
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center font-medium">
                                {equipo.cantidad}
                              </td>
                              <td className="px-4 py-2 text-right">
                                ${equipo.precioUnitario.toLocaleString('es-CL')}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {equipo.descuento > 0 ? <span className="text-red-600">{equipo.descuento}%</span> : '0%'}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-green-600">
                                ${equipo.subtotal.toLocaleString('es-CL')}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarEquipo(index)}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="Eliminar equipo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 border-t-2 border-blue-300">
                          <tr>
                            <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-900">
                              Total Equipos:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">
                              ${calcularTotalEquipos().toLocaleString('es-CL')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {equipos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm">No hay equipos agregados</p>
                      <p className="text-xs mt-1">Agrega equipos usando el formulario de arriba</p>
                    </div>
                  )}
                </div>
              )}

              {/* MANTENCIÓN/REPARACIÓN/VISITA TÉCNICA/DESINSTALACIÓN: Selección múltiple de equipos del cliente */}
              {(formData.tipo === 'mantencion' || formData.tipo === 'reparacion' || formData.tipo === 'visita_tecnica' || formData.tipo === 'desinstalacion') && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    🖥️ Equipos del Cliente
                    {equiposClienteIds.length > 0 && (
                      <span className="text-sm font-normal text-purple-600">({equiposClienteIds.length} seleccionado{equiposClienteIds.length > 1 ? 's' : ''})</span>
                    )}
                    {formData.clienteId && !editingCotizacion && (
                      <button
                        type="button"
                        onClick={() => setShowEquipoModal(true)}
                        className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors font-medium"
                      >
                        <Plus size={14} />
                        Crear Equipo Rápido
                      </button>
                    )}
                  </h3>
                  {!formData.clienteId ? (
                    <p className="text-sm text-gray-500">Primero selecciona un cliente</p>
                  ) : equiposCliente.length === 0 ? (
                    <div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-700 font-medium">⚠️ Este cliente no tiene equipos registrados</p>
                      <button
                        type="button"
                        onClick={() => setShowEquipoModal(true)}
                        className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Plus size={16} />
                        Crear Equipo Rápido
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                      {equiposCliente.map(equipo => (
                        <label key={equipo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={equiposClienteIds.includes(equipo.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEquiposClienteIds(prev => [...prev, equipo.id])
                              } else {
                                setEquiposClienteIds(prev => prev.filter(id => id !== equipo.id))
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                            disabled={editingCotizacion}
                          />
                          <span className="text-sm">
                            <span className="font-medium">{equipo.marca || '—'} {equipo.modelo || '—'}</span>
                            <span className="text-gray-500 ml-2">{equipo.capacidad}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* SECCIÓN MATERIALES */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  📦 Materiales
                  <span className="text-sm font-normal text-gray-600">
                    ({materiales.length} {materiales.length === 1 ? 'material' : 'materiales'})
                  </span>
                </h3>

                {/* Formulario para agregar material */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {/* ⭐ SELECTOR DE MATERIAL DEL INVENTARIO */}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Material del Inventario *
                      </label>
                      <select
                        value={nuevoMaterial.materialInventarioId || ''}
                        onChange={handleMaterialSelect}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar material...</option>
                        {materialesInventario.map(material => (
                          <option key={material.id} value={material.id}>
                            {material.nombre} - ${material.precioConIVA.toLocaleString('es-CL')}
                            {material.stock > 0 ? ` (Stock: ${material.stock})` : ' (Sin stock)'}
                          </option>
                        ))}
                      </select>
                      {materialesInventario.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ No hay materiales en el inventario
                        </p>
                      )}
                    </div>

                    {/* CANTIDAD */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={nuevoMaterial.cantidad}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, cantidad: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.1"
                        disabled={!nuevoMaterial.materialInventarioId}
                      />
                    </div>

                    {/* DESCUENTO $ */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Desc. $
                      </label>
                      <input
                        type="number"
                        value={nuevoMaterial.descuentoMonto}
                        onChange={(e) => {
                          const monto = parseFloat(e.target.value) || 0
                          const precioBase = (nuevoMaterial.precioUnitario || 0) * (nuevoMaterial.cantidad || 0)
                          const pct = precioBase > 0 ? (monto / precioBase) * 100 : 0
                          setNuevoMaterial(prev => ({
                            ...prev,
                            descuentoMonto: monto,
                            descuento: Math.round(pct * 100) / 100
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="1"
                        disabled={!nuevoMaterial.materialInventarioId}
                      />
                    </div>

                    {/* DESCUENTO % */}
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Desc. %
                      </label>
                      <input
                        type="number"
                        value={nuevoMaterial.descuento}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0
                          const precioBase = (nuevoMaterial.precioUnitario || 0) * (nuevoMaterial.cantidad || 0)
                          const monto = precioBase * (pct / 100)
                          setNuevoMaterial(prev => ({
                            ...prev,
                            descuento: pct,
                            descuentoMonto: Math.round(monto)
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!nuevoMaterial.materialInventarioId}
                      />
                    </div>

                    {/* UNIDAD (AUTO-COMPLETADA) */}
                    <div className="col-span-2 sm:col-span-1 border-l pl-3 ml-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={nuevoMaterial.unidad}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
                        disabled
                        readOnly
                      />
                    </div>

                    {/* BOTÓN AGREGAR */}
                    <div className="flex items-end col-span-5 sm:col-span-1 mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={agregarMaterial}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!nuevoMaterial.materialInventarioId || nuevoMaterial.cantidad <= 0}
                      >
                        <Plus size={16} />
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* INFO DEL PRECIO */}
                  {nuevoMaterial.materialInventarioId && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-800">Precio Unitario:</span>
                          <span className="text-sm font-bold text-blue-900">
                            ${nuevoMaterial.precioUnitario.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-amber-800">Descuento:</span>
                          <span className="text-sm font-bold text-amber-900">
                            -${(nuevoMaterial.descuentoMonto).toLocaleString('es-CL')} ({nuevoMaterial.descuento}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-green-800">Subtotal Final:</span>
                          <span className="text-sm font-bold text-green-900">
                            ${((nuevoMaterial.cantidad * nuevoMaterial.precioUnitario) - nuevoMaterial.descuentoMonto).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setNuevoMaterial({
                              materialInventarioId: null,
                              nombre: '',
                              cantidad: 1,
                              unidad: 'unidades',
                              precioUnitario: 0,
                              descuento: 0,
                              descuentoMonto: 0
                            })
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                          Limpiar selección
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de materiales agregados */}
                {materiales.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Cantidad</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Unidad</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Precio Unit.</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Desc. %</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Subtotal</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {materiales.map((material, index) => (
                          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-3 py-2">{material.nombre}</td>
                            <td className="px-3 py-2 text-center">{material.cantidad}</td>
                            <td className="px-3 py-2 text-center">{material.unidad}</td>
                            <td className="px-3 py-2 text-right">
                              ${material.precioUnitario.toLocaleString('es-CL')}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {material.descuento > 0 ? <span className="text-red-600">{material.descuento}%</span> : '0%'}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${material.subtotal.toLocaleString('es-CL')}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => eliminarMaterial(index)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Eliminar material"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="border-t-2 border-gray-300">
                          <td colSpan="5" className="px-3 py-2 text-right font-bold text-gray-700">
                            Total Materiales:
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-green-600">
                            ${calcularTotalMateriales().toLocaleString('es-CL')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {materiales.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm">No hay materiales agregados</p>
                    <p className="text-xs mt-1">Agrega materiales usando el formulario de arriba</p>
                  </div>
                )}
              </div>

              {/* SECCIÓN INSTALACIONES */}
              {formData.tipo === 'instalacion' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    🔧 Costos de Instalación
                    <span className="text-sm font-normal text-gray-600">
                      ({instalaciones.length} {instalaciones.length === 1 ? 'instalación' : 'instalaciones'})
                    </span>
                  </h3>

                  <div className="bg-amber-50 p-4 rounded-lg mb-4 border border-amber-200">
                    {/* Selector de tipo guardado */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar tipo guardado</label>
                      <div className="flex gap-2">
                        <select
                          onChange={(e) => handleTipoInstalacionSelect(e.target.value)}
                          className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          <option value="">Seleccionar o escribir manualmente...</option>
                          {tiposInstalacion.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nombre} - ${tipo.precio.toLocaleString('es-CL')}
                            </option>
                          ))}
                        </select>
                        {nuevaInstalacion.nombre.trim() && nuevaInstalacion.precio > 0 && (
                          <button
                            type="button"
                            onClick={guardarTipoInstalacion}
                            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-xs font-medium border border-amber-300 whitespace-nowrap transition-colors"
                            title="Guardar este tipo para reutilizar"
                          >
                            💾 Guardar tipo
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={nuevaInstalacion.nombre}
                          onChange={(e) => setNuevaInstalacion(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Ej: Instalación estándar"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio *</label>
                        <input
                          type="number"
                          value={nuevaInstalacion.precio}
                          onChange={(e) => {
                            const precio = parseFloat(e.target.value) || 0
                            setNuevaInstalacion(prev => ({
                              ...prev,
                              precio,
                              descuentoMonto: precio * (prev.descuento / 100)
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. $</label>
                        <input
                          type="number"
                          value={nuevaInstalacion.descuentoMonto}
                          onChange={(e) => handleDescuentoMontoChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. %</label>
                        <input
                          type="number"
                          value={nuevaInstalacion.descuento}
                          onChange={(e) => handleDescuentoPctChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={agregarInstalacion}
                          className="w-full px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center transition-colors text-sm font-medium"
                          disabled={!nuevaInstalacion.nombre.trim() || nuevaInstalacion.precio <= 0}
                        >
                          <Plus size={16} className="mr-1" /> Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {instalaciones.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-amber-600 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">Instalación</th>
                            <th className="px-4 py-2 text-right">Precio</th>
                            <th className="px-4 py-2 text-right">Desc. %</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                            <th className="px-4 py-2 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {instalaciones.map((inst, index) => (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <span className="font-medium">{inst.nombre}</span>
                                {inst.descripcion && (
                                  <span className="text-xs text-gray-500 block">{inst.descripcion}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">${inst.precio.toLocaleString('es-CL')}</td>
                              <td className="px-4 py-2 text-right">
                                {inst.descuento > 0 ? <span className="text-red-600">{inst.descuento}%</span> : '0%'}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-green-600">
                                ${inst.subtotal.toLocaleString('es-CL')}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarInstalacion(index)}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="Eliminar instalación"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-amber-50 border-t-2 border-amber-300">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                              Total Instalación:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-600 text-lg">
                              ${calcularTotalInstalaciones().toLocaleString('es-CL')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {instalaciones.length === 0 && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm">No hay costos de instalación agregados</p>
                      <p className="text-xs mt-1">Agrega costos de instalación usando el formulario de arriba</p>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN COSTOS DE SERVICIO (mantencion/reparacion/visita_tecnica/desinstalacion) */}
              {(formData.tipo === 'mantencion' || formData.tipo === 'reparacion' || formData.tipo === 'visita_tecnica' || formData.tipo === 'desinstalacion') && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    ⚙️ Costos del Servicio
                    <span className="text-sm font-normal text-gray-600">
                      ({mantenciones.length} {mantenciones.length === 1 ? 'costo' : 'costos'})
                    </span>
                  </h3>

                  <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-200">
                    {/* Selector del catálogo filtrado por tipo */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar del catálogo</label>
                      <select
                        onChange={(e) => {
                          const id = parseInt(e.target.value)
                          if (!id) return
                          const item = catalogoServicios.find(s => s.id === id)
                          if (item) {
                            setNuevaMantencion(prev => ({ ...prev, nombre: item.nombre, precio: item.precio, descuentoMonto: 0, descuento: 0 }))
                          }
                          e.target.value = ''
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Seleccionar o escribir manualmente...</option>
                        {catalogoServicios
                          .filter(s => s.categoria === formData.tipo)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} — ${s.precio.toLocaleString('es-CL')}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                          type="text"
                          value={nuevaMantencion.nombre}
                          onChange={(e) => setNuevaMantencion(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Ej: Mano de obra, Revisión gas..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Precio *</label>
                        <input
                          type="number"
                          value={nuevaMantencion.precio}
                          onChange={(e) => {
                            const precio = parseFloat(e.target.value) || 0
                            setNuevaMantencion(prev => ({
                              ...prev,
                              precio,
                              descuentoMonto: precio * (prev.descuento / 100)
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. $</label>
                        <input
                          type="number"
                          value={nuevaMantencion.descuentoMonto}
                          onChange={(e) => {
                            const monto = parseFloat(e.target.value) || 0
                            const precio = parseFloat(nuevaMantencion.precio) || 0
                            const pct = precio > 0 ? (monto / precio) * 100 : 0
                            setNuevaMantencion(prev => ({ ...prev, descuentoMonto: monto, descuento: Math.round(pct * 100) / 100 }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desc. %</label>
                        <input
                          type="number"
                          value={nuevaMantencion.descuento}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0
                            const precio = parseFloat(nuevaMantencion.precio) || 0
                            setNuevaMantencion(prev => ({ ...prev, descuento: pct, descuentoMonto: Math.round(precio * (pct / 100)) }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          min="0" max="100" step="0.01"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={agregarMantencion}
                          className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center transition-colors text-sm font-medium"
                          disabled={!nuevaMantencion.nombre.trim() || nuevaMantencion.precio <= 0}
                        >
                          <Plus size={16} className="mr-1" /> Agregar
                        </button>
                      </div>
                    </div>

                    {/* Checkbox guardar en catálogo */}
                    {nuevaMantencion.nombre.trim() && nuevaMantencion.precio > 0 && (
                      <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm text-purple-700 hover:text-purple-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={guardarEnCatalogo}
                          onChange={(e) => setGuardarEnCatalogo(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        💾 Guardar en catálogo para próximas veces
                      </label>
                    )}
                  </div>

                  {mantenciones.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-purple-600 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">Costo</th>
                            <th className="px-4 py-2 text-right">Precio</th>
                            <th className="px-4 py-2 text-right">Desc. %</th>
                            <th className="px-4 py-2 text-right">Subtotal</th>
                            <th className="px-4 py-2 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {mantenciones.map((m, index) => (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">{m.nombre}</td>
                              <td className="px-4 py-2 text-right">${m.precio.toLocaleString('es-CL')}</td>
                              <td className="px-4 py-2 text-right">
                                {m.descuento > 0 ? <span className="text-red-600">{m.descuento}%</span> : '0%'}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-green-600">
                                ${m.subtotal.toLocaleString('es-CL')}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button type="button" onClick={() => eliminarMantencion(index)}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-purple-50 border-t-2 border-purple-300">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">Total Servicio:</td>
                            <td className="px-4 py-3 text-right font-bold text-purple-600 text-lg">
                              ${calcularTotalMantenciones().toLocaleString('es-CL')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {mantenciones.length === 0 && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm">No hay costos de servicio agregados</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumen de totales */}
              <div className="border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento Global (%)
                  </label>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Panel de resumen dinámico */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-2 text-sm">
                  {formData.tipo === 'instalacion' && equipos.length > 0 && (
                    <div className="flex justify-between">
                      <span>Equipos ({equipos.length}):</span>
                      <span>${calcularTotalEquipos().toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {formData.tipo !== 'instalacion' && mantenciones.length > 0 && (
                    <div className="flex justify-between">
                      <span>Costos del servicio ({mantenciones.length}):</span>
                      <span>${calcularTotalMantenciones().toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {instalaciones.length > 0 && (
                    <div className="flex justify-between">
                      <span>Instalación ({instalaciones.length}):</span>
                      <span>${calcularTotalInstalaciones().toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {materiales.length > 0 && (
                    <div className="flex justify-between">
                      <span>Materiales ({materiales.length}):</span>
                      <span>${calcularTotalMateriales().toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {parseFloat(formData.descuento) > 0 && calcularTotal() > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento Global ({formData.descuento}%):</span>
                      <span>-${((calcularTotal() / (1 - formData.descuento / 100)) * (formData.descuento / 100)).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                    <span>TOTAL:</span>
                    <span>${calcularTotal().toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              {formData.tipo === 'instalacion' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de Instalación
                  </label>
                  
                  {(() => {
                    const clienteSel = clientes.find(c => c.id.toString() === formData.clienteId)
                    const direcciones = clienteSel?.direcciones || []
                    
                    if (direcciones.length === 0 || isCustomAddress) {
                      return (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={formData.direccionInstalacion}
                            onChange={(e) => setFormData({ ...formData, direccionInstalacion: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Ingrese la dirección exacta..."
                            autoFocus={isCustomAddress}
                          />
                          {direcciones.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsCustomAddress(false)}
                              className="text-xs text-blue-600 hover:text-blue-800 self-start mt-1 underline"
                            >
                              Seleccionar de las direcciones guardadas
                            </button>
                          )}
                        </div>
                      )
                    }

                    return (
                      <select
                        value={formData.direccionInstalacion}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'CUSTOM') {
                            setIsCustomAddress(true)
                            setFormData({ ...formData, direccionInstalacion: '' })
                          } else {
                            setFormData({ ...formData, direccionInstalacion: val })
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="">Seleccionar dirección...</option>
                        {direcciones.map((dir) => (
                          <option key={dir.id} value={dir.direccion}>
                            {dir.nombre} - {dir.direccion} {dir.comuna ? `(${dir.comuna})` : ''}
                          </option>
                        ))}
                        <option value="CUSTOM">+ Otra dirección (Manual)</option>
                      </select>
                    )
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Información adicional sobre la cotización"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg">
                  {editingCotizacion ? 'Guardar Cambios' : 'Crear Cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aprobación */}
      {showApproveModal && cotizacionToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Aprobar Cotización
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                ¿Estás seguro de aprobar esta cotización?
              </p>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="font-medium text-gray-900">
                  {cotizacionToApprove.cliente?.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  {cotizacionToApprove.inventario?.marca || cotizacionToApprove.equipo?.marca}{' '}
                  {cotizacionToApprove.inventario?.modelo || cotizacionToApprove.equipo?.modelo}
                </p>
                <div className="pt-2">
                  {getTipoBadge(cotizacionToApprove.tipo)}
                </div>
                <p className="text-lg font-bold text-green-600 pt-2">
                  ${cotizacionToApprove.precioFinal.toLocaleString('es-CL')}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">El sistema realizará:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      {cotizacionToApprove.tipo === 'instalacion' ? (
                        <>
                          <li>Crear registro de equipo para el cliente</li>
                          <li>Reducir stock del inventario</li>
                        </>
                      ) : (
                        <li>Usar equipo existente del cliente</li>
                      )}
                      <li>Crear orden de trabajo</li>
                      <li>Marcar cotización como aprobada</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Selector de Fecha de Instalación */}
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Instalación / Servicio
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={fechaInstalacion}
                    onChange={(e) => setFechaInstalacion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Esta fecha se usará para programar automáticamente la Orden de Trabajo.
                </p>
              </div>

            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false)
                  setCotizacionToApprove(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={approving}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAprobacion}
                disabled={approving}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Aprobar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de PDF */}
      {showPDFModal && pdfCotizacionId && (
        <VisorPDF
          cotizacionId={pdfCotizacionId}
          clienteNombre={cotizaciones.find(c => c.id === pdfCotizacionId)?.cliente?.nombre}
          onClose={() => {
            setShowPDFModal(false)
            setPdfCotizacionId(null)
          }}
        />
      )}

      {/* Modal CREAR CLIENTE RÁPIDO */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  Crear Cliente Rápido
                </h2>
              </div>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newClientData.nombre}
                  onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all focus:ring-2 focus:ring-green-500"
                  placeholder="Nombre del cliente"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT
                </label>
                <RutInput
                  value={newClientData.rut}
                  onChange={(valor) => setNewClientData({ ...newClientData, rut: valor })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  showValidation={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all focus:ring-2 focus:ring-green-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <PhoneInput
                  value={newClientData.telefono}
                  onChange={(valor) => setNewClientData({ ...newClientData, telefono: valor })}
                  defaultCountry="CL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newClientData.direccion}
                  onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all focus:ring-2 focus:ring-green-500"
                  placeholder="Calle, número, comuna"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={creatingClient}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateQuickClient}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={creatingClient || !newClientData.nombre.trim()}
              >
                {creatingClient ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear Cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== MODAL CREAR EQUIPO RÁPIDO ===== */}
      {showEquipoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🖥️</span>
                <h2 className="text-xl font-bold text-gray-800">Crear Equipo Rápido</h2>
              </div>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                💡 Solo los campos marcados con * son obligatorios. Puedes completar el resto desde la ficha del equipo.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={newEquipoData.tipo}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Split">Split</option>
                    <option value="Cassette">Cassette</option>
                    <option value="Piso Techo">Piso Techo</option>
                    <option value="Ducto">Ducto</option>
                    <option value="Portatil">Portátil</option>
                    <option value="Central">Central</option>
                    <option value="Ventana">Ventana</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
                  <input
                    type="text"
                    value={newEquipoData.capacidad}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, capacidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ej: 12000 BTU"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={newEquipoData.marca}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, marca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Midea, Samsung..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={newEquipoData.modelo}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, modelo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="MSR12CRN..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gas</label>
                  <select
                    value={newEquipoData.tipoGas}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, tipoGas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">No especificado</option>
                    <option value="R32">R32</option>
                    <option value="R410A">R410A</option>
                    <option value="R22">R22</option>
                    <option value="R134A">R134A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Serie</label>
                  <input
                    type="text"
                    value={newEquipoData.numeroSerie}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, numeroSerie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowEquipoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={creatingEquipo}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateQuickEquipo}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={creatingEquipo || !newEquipoData.tipo.trim() || !newEquipoData.capacidad.trim()}
              >
                {creatingEquipo ? (
                  <><span className="animate-spin">⏳</span> Creando...</>
                ) : (
                  <><Plus size={18} /> Crear Equipo</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Cotizaciones