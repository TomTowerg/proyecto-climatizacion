import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR
import { 
  Users, 
  Wind, 
  ClipboardList, 
  Package, 
  TrendingUp, 
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  DollarSign,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { isAuthenticated } from '../services/authService'
import { getClientes } from '../services/clienteService'
import { getEquipos } from '../services/equipoService'
import { getOrdenesTrabajo } from '../services/ordenTrabajoService'
import { getCotizaciones, getEstadisticas } from '../services/cotizacionService'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function Dashboard() {
  const { t } = useTranslation() // 2. INICIALIZAR
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    clientes: 0,
    equipos: 0,
    ordenes: 0,
    productos: 0,
    ordenesPendientes: 0,
    ordenesEnProceso: 0,
    ordenesCompletadas: 0,
    urgenciasCriticas: 0
  })
  const [cotizacionStats, setCotizacionStats] = useState(null)
  const [cotizaciones, setCotizaciones] = useState([])
  const [ordenesRecientes, setOrdenesRecientes] = useState([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserName(user.name || user.email || 'Usuario')
      }
    } catch (e) {
      setUserName('Usuario')
    }
    
    fetchDashboardData()
  }, [navigate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [clientes, equipos, ordenes] = await Promise.all([
        getClientes(),
        getEquipos(),
        getOrdenesTrabajo()
      ])

      let productos = []
      try {
        const inventarioModule = await import('../services/inventarioService')
        if (inventarioModule.getInventario) {
          productos = await inventarioModule.getInventario()
        }
      } catch (error) {
        console.log('Inventario no disponible')
        productos = []
      }

      try {
        const [cotizacionStatsData, cotizacionesData] = await Promise.all([
          getEstadisticas(),
          getCotizaciones()
        ])
        setCotizacionStats(cotizacionStatsData)
        setCotizaciones(cotizacionesData)
      } catch (error) {
        console.log('Estadísticas de cotizaciones no disponibles')
      }

      const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente').length
      const ordenesEnProceso = ordenes.filter(o => o.estado === 'en_proceso').length
      const ordenesCompletadas = ordenes.filter(o => o.estado === 'completado').length
      const urgenciasCriticas = ordenes.filter(o => o.urgencia === 'critica').length

      setStats({
        clientes: clientes.length,
        equipos: equipos.length,
        ordenes: ordenes.length,
        productos: productos.length,
        ordenesPendientes,
        ordenesEnProceso,
        ordenesCompletadas,
        urgenciasCriticas
      })

      const recientes = ordenes
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5)
      setOrdenesRecientes(recientes)

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
      toast.error(t('common.error')) // Usando traducción para error
    } finally {
      setLoading(false)
    }
  }

  const getUrgenciaIcon = (urgencia) => {
    const icons = {
      critica: '🔴',
      media: '🟡',
      baja: '🟢'
    }
    return icons[urgencia] || '🟡'
  }

  const getEstadoInfo = (estado) => {
    const info = {
      pendiente: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      en_proceso: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
      completado: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
    }
    return info[estado] || info.pendiente
  }

  const cotizacionesChartData = cotizacionStats ? [
    { name: t('workOrders.statuses.pending'), value: cotizacionStats.pendientes, color: '#EAB308' },
    { name: t('dashboard.approved'), value: cotizacionStats.aprobadas, color: '#22C55E' },
    { name: t('dashboard.rejected'), value: cotizacionStats.rechazadas, color: '#EF4444' }
  ].filter(item => item.value > 0) : []

  const getCotizacionesPorMes = () => {
    if (!cotizaciones || cotizaciones.length === 0) return []

    const ahora = new Date()
    const meses = []
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const nombreMes = fecha.toLocaleDateString('es-CL', { month: 'short' })
      const mes = fecha.getMonth()
      const año = fecha.getFullYear()
      
      const cotizacionesMes = cotizaciones.filter(c => {
        const fechaCot = new Date(c.createdAt || c.fechaCotizacion)
        return fechaCot.getMonth() === mes && fechaCot.getFullYear() === año
      })

      meses.push({
        mes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        total: cotizacionesMes.length,
        aprobadas: cotizacionesMes.filter(c => c.estado === 'aprobada').length,
        pendientes: cotizacionesMes.filter(c => c.estado === 'pendiente').length
      })
    }

    return meses
  }

  const cotizacionesMensuales = getCotizacionesPorMes()

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
        {/* Header con Bienvenida TRADUCIDA */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
             👋 {t('dashboard.welcome', { name: userName })}
          </h1>
          <p className="text-gray-600">
            {t('dashboard.summary')}
          </p>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Clientes */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clientes')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('nav.clients')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.clientes}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.totalRegistered')}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          {/* Equipos */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/equipos')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('nav.equipment')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.equipos}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.totalInstalled')}</p>
              </div>
              <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center">
                <Wind className="text-cyan-600" size={28} />
              </div>
            </div>
          </div>

          {/* Órdenes de Trabajo */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/ordenes-trabajo')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('nav.workOrders')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.ordenes}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.totalWorks')}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <ClipboardList className="text-purple-600" size={28} />
              </div>
            </div>
          </div>

          {/* Inventario */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/inventario')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('dashboard.products')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.productos}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.inStock')}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="text-green-600" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Cotizaciones */}
        {cotizacionStats && (
          <div className="card mb-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/cotizaciones')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={24} />
                {t('nav.quotes')}
              </h2>
              <ArrowRight className="text-gray-400" size={20} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Total */}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{cotizacionStats.total}</p>
                <p className="text-xs text-gray-600 mt-1">Total</p>
              </div>

              {/* Pendientes */}
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{cotizacionStats.pendientes}</p>
                <p className="text-xs text-gray-600 mt-1">{t('workOrders.statuses.pending')}</p>
              </div>

              {/* Aprobadas */}
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{cotizacionStats.aprobadas}</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.approved')}</p>
              </div>

              {/* Tasa */}
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{cotizacionStats.tasaAprobacion}%</p>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.approvalRate')}</p>
              </div>

              {/* Valor */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <DollarSign className="text-green-600" size={20} />
                  <p className="text-xl font-bold text-green-600">
                    {(cotizacionStats.valorTotalAprobadas / 1000000).toFixed(1)}M
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">{t('dashboard.totalValue')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {cotizacionesChartData.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="text-indigo-600" size={20} />
                {t('dashboard.quotesDistribution')}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cotizacionesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cotizacionesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {cotizacionesMensuales.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                {t('dashboard.quotesLast6Months')}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cotizacionesMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="aprobadas" fill="#22C55E" name={t('dashboard.approved')} />
                  <Bar dataKey="pendientes" fill="#EAB308" name={t('workOrders.statuses.pending')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Estado de Órdenes */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} />
              {t('dashboard.ordersStatus')}
            </h2>
            
            <div className="space-y-4">
              {/* Pendientes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="text-yellow-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">{t('workOrders.statuses.pending')}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.ordenesPendientes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.ordenes > 0 ? (stats.ordenesPendientes / stats.ordenes) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* En Proceso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">{t('workOrders.statuses.inProgress')}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.ordenesEnProceso}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.ordenes > 0 ? (stats.ordenesEnProceso / stats.ordenes) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Completadas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">{t('workOrders.statuses.completed')}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.ordenesCompletadas}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.ordenes > 0 ? (stats.ordenesCompletadas / stats.ordenes) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Alerta de Urgencias Críticas */}
            {stats.urgenciasCriticas > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    ⚠️ {stats.urgenciasCriticas} {t('dashboard.criticalAlert', { count: stats.urgenciasCriticas })}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {t('dashboard.attentionRequired')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Órdenes Recientes */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              {t('dashboard.recentOrders')}
            </h2>
            
            {ordenesRecientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-3 text-gray-400" />
                <p>{t('dashboard.noOrders')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordenesRecientes.map((orden) => {
                  const EstadoIcon = getEstadoInfo(orden.estado).icon
                  return (
                    <div 
                      key={orden.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                      onClick={() => navigate('/ordenes-trabajo')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getUrgenciaIcon(orden.urgencia)}
                            </span>
                            <span className="font-medium text-gray-900">
                              {orden.cliente?.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <EstadoIcon size={12} className={getEstadoInfo(orden.estado).color} />
                              {/* Traducir estados dinámicamente sería ideal, por ahora uso reemplazo básico */}
                              {orden.estado.replace('_', ' ')}
                            </span>
                            <span>•</span>
                            <span>{orden.tipo}</span>
                            <span>•</span>
                            <span>{new Date(orden.fecha).toLocaleDateString(t('common.dateFormat'))}</span>
                          </div>
                        </div>
                        <ArrowRight className="text-gray-400" size={18} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ {t('dashboard.quickAccess')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/ordenes-trabajo')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left border border-blue-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plus className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('dashboard.quickNewOrder')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.create')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/clientes')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left border border-green-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Plus className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('dashboard.quickNewClient')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.register')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/inventario')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left border border-purple-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('nav.inventory')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.viewStock')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/cotizaciones')}
              className="p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors text-left border border-cyan-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                  <Plus className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('dashboard.quickNewQuote')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.new')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard