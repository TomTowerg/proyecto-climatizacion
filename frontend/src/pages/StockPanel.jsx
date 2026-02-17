import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // 1. IMPORTAR
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Search,
  ArrowRight,
  Box
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'

import { isAuthenticated } from '../services/authService'
import { getInventario, updateInventario } from '../services/inventarioService'
import { getCotizaciones } from '../services/cotizacionService'

function StockPanel() {
  const { t } = useTranslation() // 2. INICIALIZAR
  const navigate = useNavigate()
  const [inventario, setInventario] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showReponerModal, setShowReponerModal] = useState(false)
  const [productoReponer, setProductoReponer] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchData()
  }, [navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [inventarioData, cotizacionesData] = await Promise.all([
        getInventario(),
        getCotizaciones()
      ])
      setInventario(inventarioData)
      setCotizaciones(cotizacionesData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error(t('stockPanel.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // Productos con stock bajo
  const productosStockBajo = inventario.filter(item => item.stock > 0 && item.stock <= 3)

  // Productos agotados
  const productosAgotados = inventario.filter(item => item.stock === 0 || item.estado === 'agotado')

  // Calcular movimientos recientes basados en cotizaciones aprobadas
  const movimientosRecientes = cotizaciones
    .filter(c => c.estado === 'aprobada')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      tipo: 'salida',
      producto: c.inventario || c.equipo, // Ajuste para manejar ambos casos
      cantidad: 1,
      fecha: c.createdAt,
      // Usamos una clave especial para interpolar en el renderizado
      motivoKey: 'stockPanel.movementReason',
      motivoParams: { id: c.id, client: c.cliente?.nombre },
      destino: c.cliente?.nombre
    }))

  // Estadísticas
  const stats = {
    total: inventario.length,
    disponibles: inventario.filter(i => i.estado === 'disponible' && i.stock > 3).length,
    stockBajo: productosStockBajo.length,
    agotados: productosAgotados.length,
    valorInventario: inventario.reduce((sum, item) => sum + (item.precioCliente * item.stock), 0)
  }

  const handleReponer = (producto) => {
    setProductoReponer(producto)
    setCantidadReponer('')
    setShowReponerModal(true)
  }

  const confirmarReposicion = async () => {
    if (!productoReponer || !cantidadReponer) return

    try {
      const cantidad = parseInt(cantidadReponer)
      if (cantidad <= 0) {
        toast.error(t('stockPanel.messages.invalidAmount'))
        return
      }

      const nuevoStock = productoReponer.stock + cantidad

      await updateInventario(productoReponer.id, {
        stock: nuevoStock,
        estado: nuevoStock > 0 ? 'disponible' : 'agotado'
      })

      toast.success(t('stockPanel.messages.updateSuccess', { amount: cantidad }))
      setShowReponerModal(false)
      setProductoReponer(null)
      setCantidadReponer('')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('stockPanel.messages.updateError'))
    }
  }

  const filteredProductosStockBajo = productosStockBajo.filter(item =>
    item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSkeleton accentColor="orange" rows={6} columns={4} showStats={true} statCards={5} />
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="text-white" size={22} />
                </div>
                {t('stockPanel.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('stockPanel.subtitle')} • {stats.stockBajo} alertas activas
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/inventario')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Package size={20} />
                {t('stockPanel.viewFullInventory')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">

        {/* Estadísticas */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stockPanel.stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stockPanel.stats.available')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.disponibles}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stockPanel.stats.lowStock')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.stockBajo}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stockPanel.stats.outOfStock')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.agotados}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('stockPanel.stats.totalValue')}</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(stats.valorInventario / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-orange-600" size={24} />
                {t('stockPanel.sections.lowStock')}
              </h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                {t('stockPanel.alerts', { count: stats.stockBajo })}
              </span>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-0 focus:ring-0 outline-none text-sm"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProductosStockBajo.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? (
                    t('stockPanel.empty.noResults')
                  ) : (
                    <div>
                      <Package size={48} className="mx-auto mb-3 text-gray-400" />
                      <p>{t('stockPanel.empty.lowStock')}</p>
                    </div>
                  )}
                </div>
              ) : (
                filteredProductosStockBajo.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-orange-600" />
                          <p className="font-semibold text-gray-900">
                            {item.marca} {item.modelo}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{item.tipo}</span>
                          <span>•</span>
                          <span className="font-bold text-orange-600">
                            {t('inventory.table.stock')}: {item.stock}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReponer(item)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 text-sm transition-all shadow-md"
                      >
                        <RefreshCw size={16} />
                        {t('stockPanel.actions.restock')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingDown className="text-blue-600" size={24} />
                {t('stockPanel.sections.recentMovements')}
              </h2>
              <span className="text-sm text-gray-600">{t('stockPanel.last10')}</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movimientosRecientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingDown size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>{t('stockPanel.empty.movements')}</p>
                </div>
              ) : (
                movimientosRecientes.map(mov => (
                  <div
                    key={mov.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${mov.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {mov.producto?.marca} {mov.producto?.modelo}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {t(mov.motivoKey, mov.motivoParams)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {new Date(mov.fecha).toLocaleDateString(t('common.dateFormat'), {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>•</span>
                          <span>→ {mov.destino}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Productos Agotados */}
        {productosAgotados.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-red-600" size={24} />
                {t('stockPanel.sections.outOfStock')}
              </h2>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {productosAgotados.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productosAgotados.slice(0, 6).map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.marca} {item.modelo}
                      </p>
                      <p className="text-sm text-gray-600">{item.tipo}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      {t('inventory.status.outOfStock')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleReponer(item)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 text-sm transition-all shadow-md"
                  >
                    <RefreshCw size={16} />
                    {t('stockPanel.actions.restock')}
                  </button>
                </div>
              ))}
            </div>

            {productosAgotados.length > 6 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/inventario')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                >
                  {t('stockPanel.viewAllOut')}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Reposición */}
      {showReponerModal && productoReponer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('stockPanel.modal.title')}
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">
                  {productoReponer.marca} {productoReponer.modelo}
                </p>
                <p className="text-sm text-gray-600">{productoReponer.tipo}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('stockPanel.modal.currentStock')}: <span className="font-bold">{productoReponer.stock}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('stockPanel.modal.amountToAdd')} *
                </label>
                <input
                  type="number"
                  value={cantidadReponer}
                  onChange={(e) => setCantidadReponer(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder={t('stockPanel.modal.placeholder')}
                  autoFocus
                />
              </div>

              {cantidadReponer && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {t('stockPanel.modal.newStock')}: <span className="font-bold text-green-600">
                      {productoReponer.stock + parseInt(cantidadReponer || 0)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReponerModal(false)
                  setProductoReponer(null)
                  setCantidadReponer('')
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmarReposicion}
                disabled={!cantidadReponer || parseInt(cantidadReponer) <= 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                {t('stockPanel.actions.confirmRestock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default StockPanel