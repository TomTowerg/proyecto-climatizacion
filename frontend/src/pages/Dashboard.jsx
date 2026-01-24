import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  BarChart3,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Bell,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import EconomicIndicators from '../components/EconomicIndicators'
import { isAuthenticated } from '../services/authService'
import { getClientes } from '../services/clienteService'
import { getEquipos } from '../services/equipoService'
import { getOrdenesTrabajo } from '../services/ordenTrabajoService'
import { getCotizaciones, getEstadisticas } from '../services/cotizacionService'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

function Dashboard() {
  const { t } = useTranslation()
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
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

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

  // Calcular porcentaje de completadas
  const porcentajeCompletadas = stats.ordenes > 0 
    ? Math.round((stats.ordenesCompletadas / stats.ordenes) * 100) 
    : 0

  // Datos para el gráfico de área
  const marketData = cotizacionesMensuales.map((mes, idx) => ({
    name: mes.mes,
    aprobadas: mes.aprobadas,
    pendientes: mes.pendientes,
    total: mes.total
  }))

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Zap className="text-indigo-600 animate-pulse" size={24} />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Top Header - Barra superior con título, búsqueda y notificaciones */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('nav.dashboard')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Barra de búsqueda y acciones */}
            <div className="flex items-center gap-3">
              {/* Búsqueda */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
              </div>

              {/* Notificaciones */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-600" />
                {stats.urgenciasCriticas > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">
        {/* Indicadores Económicos */}
        <div className="mb-8">
          <EconomicIndicators />
        </div>

        {/* ⭐ CARDS DE ESTADÍSTICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Clientes */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/clientes')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Users className="text-white" size={28} />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <TrendingUp size={14} />
                  <span>25%</span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t('nav.clients')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.clientes}</p>
                <p className="text-xs text-gray-400 mt-2">{t('dashboard.totalRegistered')}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Equipos */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/equipos')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Wind className="text-white" size={28} />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <TrendingUp size={14} />
                  <span>18%</span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t('nav.equipment')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.equipos}</p>
                <p className="text-xs text-gray-400 mt-2">{t('dashboard.totalInstalled')}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Órdenes */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/ordenes-trabajo')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <ClipboardList className="text-white" size={28} />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                  <TrendingDown size={14} />
                  <span>15%</span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t('nav.workOrders')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.ordenes}</p>
                <p className="text-xs text-gray-400 mt-2">{t('dashboard.totalWorks')}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Inventario */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/inventario')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Package className="text-white" size={28} />
                </div>
                <div className="text-xs bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold text-emerald-700">
                  Stock OK
                </div>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{t('dashboard.products')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.productos}</p>
                <p className="text-xs text-gray-400 mt-2">{t('dashboard.inStock')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ SECCIÓN DE GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Overview - Gráfico de Barras */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="text-indigo-600" size={20} />
                  Market Overview
                </h3>
                <p className="text-sm text-gray-500 mt-1">Cotizaciones últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-gray-600">Aprobadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-gray-600">Pendientes</span>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                  labelStyle={{ color: '#1f2937', fontWeight: 600 }}
                />
                <Bar dataKey="aprobadas" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pendientes" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Overview - Gráfico Circular */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Target className="text-indigo-600" size={20} />
                Sales Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">Progreso mensual</p>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${porcentajeCompletadas * 2.51} 251`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                      {porcentajeCompletadas}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Completado</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completadas</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats.ordenesCompletadas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">En Proceso</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats.ordenesEnProceso}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pendientes</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats.ordenesPendientes}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">System status</span>
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    OPTIMUM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ ACTIVIDADES RECIENTES */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-purple-600" size={20} />
              {t('dashboard.recentOrders')}
            </h3>
            <button 
              onClick={() => navigate('/ordenes-trabajo')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver todas
              <ArrowRight size={16} />
            </button>
          </div>

          {ordenesRecientes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">{t('dashboard.noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenesRecientes.map((orden, index) => {
                const getIconoBg = (estado) => {
                  if (estado === 'completado') return 'bg-green-100'
                  if (estado === 'en_proceso') return 'bg-blue-100'
                  return 'bg-yellow-100'
                }
                
                const getIconoColor = (estado) => {
                  if (estado === 'completado') return 'text-green-600'
                  if (estado === 'en_proceso') return 'text-blue-600'
                  return 'text-yellow-600'
                }

                return (
                  <div 
                    key={orden.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200"
                    onClick={() => navigate('/ordenes-trabajo')}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 ${getIconoBg(orden.estado)} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {orden.estado === 'completado' && <CheckCircle className={getIconoColor(orden.estado)} size={20} />}
                        {orden.estado === 'en_proceso' && <TrendingUp className={getIconoColor(orden.estado)} size={20} />}
                        {orden.estado === 'pendiente' && <Clock className={getIconoColor(orden.estado)} size={20} />}
                      </div>
                      {index < ordenesRecientes.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{orden.cliente?.nombre}</span>
                        {orden.urgencia === 'critica' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Urgente
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {orden.tipo?.charAt(0).toUpperCase() + orden.tipo?.slice(1)} • {orden.estado.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(orden.fecha).toLocaleDateString('es-CL', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                      <ArrowRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" size={18} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alerta de Urgencias */}
        {stats.urgenciasCriticas > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-600 animate-pulse" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  {stats.urgenciasCriticas} {t('dashboard.criticalAlert', { count: stats.urgenciasCriticas })}
                </h3>
                <p className="text-sm text-red-700">
                  {t('dashboard.attentionRequired')} - Requieren atención inmediata
                </p>
              </div>
              <button 
                onClick={() => navigate('/ordenes-trabajo')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Ver órdenes
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Dashboard
