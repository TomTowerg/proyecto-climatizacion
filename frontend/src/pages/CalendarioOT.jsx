import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR
import { Calendar, Clock, MapPin, User, AlertCircle, X, CheckCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import { Download, Filter } from 'lucide-react'
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
  const { t } = useTranslation() // 2. INICIALIZAR
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
      toast.error(t('calendar.messages.loadError'))
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

  // Mensajes dinámicos para el calendario
  const messages = {
    allDay: t('calendar.views.allDay'),
    previous: t('calendar.views.previous'),
    next: t('calendar.views.next'),
    today: t('calendar.views.today'),
    month: t('calendar.views.month'),
    week: t('calendar.views.week'),
    day: t('calendar.views.day'),
    agenda: t('calendar.views.agenda'),
    date: t('calendar.views.date'),
    time: t('calendar.views.time'),
    event: t('calendar.views.event'),
    noEventsInRange: t('calendar.views.noEvents'),
    showMore: total => `+ ${t('calendar.views.showMore', { count: total })}`
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
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="text-white" size={22} />
                </div>
                {t('calendar.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('calendar.subtitle')} • {ordenes.length} órdenes programadas
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={18} />
                <span className="hidden md:inline">Exportar</span>
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter size={18} />
                <span className="hidden md:inline">Filtros</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
            <p className="text-sm text-gray-600">{t('inventory.stats.total')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('workOrders.statuses.pending')}</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('workOrders.statuses.inProgress')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('workOrders.statuses.completed')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">{t('workOrders.urgencies.critical')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.criticas}</p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('calendar.legend')}:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-gray-700">{t('workOrders.statuses.pending')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-gray-700">{t('workOrders.statuses.inProgress')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-700">{t('workOrders.statuses.completed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-700">{t('workOrders.urgencies.critical')}</span>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" style={{ height: '700px' }}>
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
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {getEstadoIcon(selectedEvento.estado)}
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('calendar.orderDetail', { id: selectedEvento.id })}
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
                  <p className="text-sm text-gray-600">{t('workOrders.form.client')}</p>
                  <p className="font-semibold text-gray-900">{selectedEvento.cliente?.nombre}</p>
                  <p className="text-sm text-gray-600">{selectedEvento.cliente?.email}</p>
                  <p className="text-sm text-gray-600">{selectedEvento.cliente?.telefono}</p>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="flex items-start gap-3">
                <Clock className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">{t('calendar.dateTime')}</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedEvento.fecha).toLocaleDateString(t('common.dateFormat'), { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {selectedEvento.horaProgramada && (
                    <p className="text-sm text-gray-600">{t('calendar.time')}: {selectedEvento.horaProgramada}</p>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div className="flex items-start gap-3">
                <MapPin className="text-red-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">{t('clients.form.address')}</p>
                  <p className="font-semibold text-gray-900">{selectedEvento.direccion || t('calendar.noAddress')}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">{t('workOrders.form.type')}</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedEvento.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('workOrders.table.urgency')}</p>
                  <p className="font-semibold text-gray-900">
                    {getUrgenciaIcon(selectedEvento.urgencia)} {selectedEvento.urgencia}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('workOrders.form.status')}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(selectedEvento.estado)}`}>
                    {selectedEvento.estado.replace('_', ' ')}
                  </span>
                </div>
                {selectedEvento.tecnicoAsignado && (
                  <div>
                    <p className="text-sm text-gray-600">{t('workOrders.form.technician')}</p>
                    <p className="font-semibold text-gray-900">{selectedEvento.tecnicoAsignado}</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {selectedEvento.descripcion && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">{t('workOrders.form.notes')}</p>
                  <p className="text-gray-900">{selectedEvento.descripcion}</p>
                </div>
              )}

              {/* Equipo */}
              {selectedEvento.equipo && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">{t('quotes.form.equipment')}</p>
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all font-medium shadow-lg"
                >
                  {t('calendar.viewAll')}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default CalendarioOT