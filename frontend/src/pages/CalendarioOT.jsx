import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, MapPin, User, AlertCircle, X, CheckCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getOrdenesTrabajo } from '../services/ordenTrabajoService'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Configurar localización en español
const locales = {
  'es': es
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

function CalendarioOT() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvento, setSelectedEvento] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState('month')

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchOrdenes()
  }, [navigate])

  const fetchOrdenes = async () => {
    try {
      setLoading(true)
      const data = await getOrdenesTrabajo()
      setOrdenes(data)
    } catch (error) {
      console.error('Error al cargar órdenes:', error)
      toast.error('Error al cargar órdenes de trabajo')
    } finally {
      setLoading(false)
    }
  }

  // Convertir órdenes a eventos del calendario
  const eventos = useMemo(() => {
    return ordenes.map(orden => {
      const fecha = new Date(orden.fecha)
      
      // Si tiene hora programada, usarla; sino usar 09:00
      let horaInicio = new Date(fecha)
      horaInicio.setHours(orden.horaProgramada ? parseInt(orden.horaProgramada.split(':')[0]) : 9)
      horaInicio.setMinutes(orden.horaProgramada ? parseInt(orden.horaProgramada.split(':')[1]) : 0)
      
      // Duración estimada según tipo
      const duracionHoras = orden.tipo === 'instalacion' ? 4 : orden.tipo === 'reparacion' ? 2 : 1
      let horaFin = addHours(horaInicio, duracionHoras)

      // Color según estado
      let color = '#6B7280' // gris por defecto
      if (orden.estado === 'pendiente') color = '#EAB308' // amarillo
      if (orden.estado === 'en_proceso') color = '#3B82F6' // azul
      if (orden.estado === 'completado') color = '#22C55E' // verde
      if (orden.urgencia === 'critica') color = '#EF4444' // rojo

      return {
        id: orden.id,
        title: `${orden.cliente?.nombre} - ${orden.tipo}`,
        start: horaInicio,
        end: horaFin,
        resource: orden,
        backgroundColor: color,
        borderColor: color
      }
    })
  }, [ordenes])

  const handleSelectEvent = (evento) => {
    setSelectedEvento(evento.resource)
    setShowModal(true)
  }

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_proceso: 'bg-blue-100 text-blue-800 border-blue-300',
      completado: 'bg-green-100 text-green-800 border-green-300'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const getUrgenciaIcon = (urgencia) => {
    if (urgencia === 'critica') return '🔴'
    if (urgencia === 'media') return '🟡'
    return '🟢'
  }

  const getEstadoIcon = (estado) => {
    if (estado === 'pendiente') return <Clock className="w-5 h-5 text-yellow-600" />
    if (estado === 'en_proceso') return <TrendingUp className="w-5 h-5 text-blue-600" />
    if (estado === 'completado') return <CheckCircle className="w-5 h-5 text-green-600" />
    return <AlertCircle className="w-5 h-5 text-gray-600" />
  }

  // Estilos personalizados para el calendario
  const eventStyleGetter = (evento) => {
    return {
      style: {
        backgroundColor: evento.backgroundColor,
        borderColor: evento.borderColor,
        borderWidth: '2px',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: `2px solid ${evento.borderColor}`,
        fontSize: '0.85rem',
        padding: '2px 5px'
      }
    }
  }

  // Mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay órdenes en este rango',
    showMore: total => `+ Ver más (${total})`
  }

  // Estadísticas rápidas
  const stats = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    enProceso: ordenes.filter(o => o.estado === 'en_proceso').length,
    completadas: ordenes.filter(o => o.estado === 'completado').length,
    criticas: ordenes.filter(o => o.urgencia === 'critica').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={32} />
            Calendario de Órdenes
          </h1>
          <p className="text-gray-600 mt-1">
            Visualización de órdenes de trabajo programadas
          </p>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Críticas</p>
            <p className="text-2xl font-bold text-red-600">{stats.criticas}</p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leyenda:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-gray-700">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-gray-700">En Proceso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-700">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-700">Urgencia Crítica</span>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="card" style={{ height: '700px' }}>
          <BigCalendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            culture="es"
            views={['month', 'week', 'day', 'agenda']}
            view={view}
            onView={setView}
            defaultDate={new Date()}
            style={{ height: '100%' }}
            tooltipAccessor={(evento) => `${evento.title} - ${evento.resource.estado}`}
          />
        </div>
      </main>

      {/* Modal de Detalles */}
      {showModal && selectedEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {getEstadoIcon(selectedEvento.estado)}
                <h2 className="text-2xl font-bold text-gray-900">
                  Orden de Trabajo #{selectedEvento.id}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cliente */}
              <div className="flex items-start gap-3">
                <User className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold text-gray-900">{selectedEvento.cliente?.nombre}</p>
                  <p className="text-sm text-gray-600">{selectedEvento.cliente?.email}</p>
                  <p className="text-sm text-gray-600">{selectedEvento.cliente?.telefono}</p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="flex items-start gap-3">
                <Clock className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedEvento.fecha).toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {selectedEvento.horaProgramada && (
                    <p className="text-sm text-gray-600">Hora: {selectedEvento.horaProgramada}</p>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div className="flex items-start gap-3">
                <MapPin className="text-red-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-semibold text-gray-900">{selectedEvento.direccion}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Servicio</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedEvento.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Urgencia</p>
                  <p className="font-semibold text-gray-900">
                    {getUrgenciaIcon(selectedEvento.urgencia)} {selectedEvento.urgencia}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(selectedEvento.estado)}`}>
                    {selectedEvento.estado.replace('_', ' ')}
                  </span>
                </div>
                {selectedEvento.tecnicoAsignado && (
                  <div>
                    <p className="text-sm text-gray-600">Técnico</p>
                    <p className="font-semibold text-gray-900">{selectedEvento.tecnicoAsignado}</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {selectedEvento.descripcion && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Descripción</p>
                  <p className="text-gray-900">{selectedEvento.descripcion}</p>
                </div>
              )}

              {/* Equipo */}
              {selectedEvento.equipo && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Equipo</p>
                  <p className="text-gray-900">
                    {selectedEvento.equipo.marca} {selectedEvento.equipo.modelo} - {selectedEvento.equipo.capacidad}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowModal(false)
                    navigate('/ordenes-trabajo')
                  }}
                  className="flex-1 btn-primary"
                >
                  Ver Todas las Órdenes
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioOT