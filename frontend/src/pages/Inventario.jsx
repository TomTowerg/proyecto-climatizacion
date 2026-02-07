import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Package, AlertCircle, TrendingUp, TrendingDown, DollarSign, Box } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import { Filter, Download } from 'lucide-react'
import { isAuthenticated } from '../services/authService'
import { getInventario, createInventario, updateInventario, deleteInventario } from '../services/inventarioService'

function Inventario() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [inventario, setInventario] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    capacidadBTU: '',
    stock: 1,
    stockMinimo: 1,
    precioCompra: '',
    precioCliente: '',
    precioInstalacion: '',
    estado: 'disponible',
    ubicacion: '',
    proveedor: '',
    caracteristicas: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/')
      return
    }
    fetchInventario()
  }, [navigate])

  const fetchInventario = async () => {
    try {
      setLoading(true)
      const data = await getInventario()
      setInventario(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar inventario:', error)
      toast.error(t('inventory.messages.loadError'))
      setInventario([])
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas de forma segura
  const calcularEstadisticas = () => {
    if (!Array.isArray(inventario) || inventario.length === 0) {
      return {
        total: 0,
        disponibles: 0,
        stockBajo: 0,
        agotados: 0,
        valorTotal: 0
      }
    }

    return {
      total: inventario.length,
      disponibles: inventario.filter(item => item.estado === 'disponible' && item.stock > 0).length,
      stockBajo: inventario.filter(item => item.stock <= (item.stockMinimo || 1) && item.stock > 0).length,
      agotados: inventario.filter(item => item.stock === 0).length,
      valorTotal: inventario.reduce((sum, item) => {
        const precio = parseFloat(item.precioCliente) || 0
        const stock = parseInt(item.stock) || 0
        return sum + (precio * stock)
      }, 0)
    }
  }

  const stats = calcularEstadisticas()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...formData,
        capacidadBTU: formData.capacidadBTU ? String(formData.capacidadBTU) : null,
        stock: parseInt(formData.stock) || 0,
        stockMinimo: parseInt(formData.stockMinimo) || 1,
        precioCompra: parseFloat(formData.precioCompra) || 0,
        precioCliente: parseFloat(formData.precioCliente) || 0,
        precioInstalacion: parseFloat(formData.precioInstalacion) || 0
      }

      if (editingItem) {
        await updateInventario(editingItem.id, dataToSend)
        toast.success(t('inventory.messages.updateSuccess'))
      } else {
        await createInventario(dataToSend)
        toast.success(t('inventory.messages.createSuccess'))
      }
      
      fetchInventario()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || t('inventory.messages.saveError'))
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      tipo: item.tipo || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      numeroSerie: item.numeroSerie || '',
      capacidadBTU: item.capacidadBTU?.toString() || '',
      stock: item.stock?.toString() || '0',
      stockMinimo: item.stockMinimo?.toString() || '1',
      precioCompra: item.precioCompra?.toString() || '',
      precioCliente: item.precioCliente?.toString() || '',
      precioInstalacion: item.precioInstalacion?.toString() || '',
      estado: item.estado || 'disponible',
      ubicacion: item.ubicacion || '',
      proveedor: item.proveedor || '',
      caracteristicas: item.caracteristicas || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('inventory.messages.deleteConfirm'))) {
      return
    }

    try {
      await deleteInventario(id)
      toast.success(t('inventory.messages.deleteSuccess'))
      fetchInventario()
    } catch (error) {
      console.error('Error:', error)
      toast.error(t('inventory.messages.deleteError'))
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      tipo: '',
      marca: '',
      modelo: '',
      numeroSerie: '',
      capacidadBTU: '',
      stock: 1,
      stockMinimo: 1,
      precioCompra: '',
      precioCliente: '',
      precioInstalacion: '',
      estado: 'disponible',
      ubicacion: '',
      proveedor: '',
      caracteristicas: ''
    })
  }

  const getStockStatus = (item) => {
    const stock = parseInt(item.stock) || 0
    const stockMin = parseInt(item.stockMinimo) || 1
    
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, text: t('inventory.status.outOfStock') }
    if (stock <= stockMin) return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: TrendingDown, text: t('inventory.status.lowStock') }
    return { color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp, text: t('inventory.status.available') }
  }

  const formatPrice = (value) => {
    const num = parseFloat(value) || 0
    return num.toLocaleString(t('common.dateFormat'), { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const filteredInventario = inventario.filter(item => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (item.marca?.toLowerCase() || '').includes(search) ||
      (item.modelo?.toLowerCase() || '').includes(search) ||
      (item.numeroSerie?.toLowerCase() || '').includes(search) ||
      (item.tipo?.toLowerCase() || '').includes(search)
    )
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
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
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="text-white" size={22} />
                </div>
                {t('inventory.title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('inventory.subtitle')} • Total: {stats.total} productos
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={18} />
                <span className="hidden md:inline">Exportar</span>
              </button>
              
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                {t('inventory.add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('inventory.stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Box className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('inventory.stats.available')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.disponibles}</p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('inventory.stats.lowStock')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.stockBajo}</p>
              </div>
              <AlertCircle className="text-yellow-500" size={24} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('inventory.stats.outOfStock')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.agotados}</p>
              </div>
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('inventory.stats.totalValue')}</p>
                <p className="text-2xl font-bold text-blue-600">${formatPrice(stats.valorTotal)}</p>
              </div>
              <DollarSign className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('inventory.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter size={20} className="text-gray-600" />
              <span className="text-gray-700">Filtros</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.type')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.brandModel')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.capacity')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.stock')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.purchasePrice')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.salePrice')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.status')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('inventory.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventario.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? t('inventory.table.noResults') : t('inventory.table.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredInventario.map((item) => {
                    const stockStatus = getStockStatus(item)
                    const StockIcon = stockStatus.icon
                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.tipo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.marca || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{item.modelo || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(item.capacidadBTU || 0).toLocaleString()} BTU
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.stock || 0}</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${stockStatus.bg} ${stockStatus.color} flex items-center gap-1`}>
                              <StockIcon size={12} className="inline mr-1" />
                              {stockStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${formatPrice(item.precioCompra || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${formatPrice(item.precioCliente || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.estado === 'disponible' ? t('inventory.status.available') : item.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t('common.edit')}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 size={18} />
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
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          {t('inventory.showing', { count: filteredInventario.length, total: inventario.length })}
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? t('inventory.edit') : t('inventory.add')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.type')} *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    <option value="Split">Split</option>
                    <option value="Split Muro">Split Muro</option>
                    <option value="Cassette">Cassette</option>
                    <option value="Piso-Cielo">Piso-Cielo</option>
                    <option value="VRF">VRF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.brand')} *
                  </label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.model')} *
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.serialNumber')} *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroSerie}
                    onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.capacityBTU')} *
                  </label>
                  <input
                    type="number"
                    value={formData.capacidadBTU}
                    onChange={(e) => setFormData({ ...formData, capacidadBTU: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Gas *
                  </label>
                  <select
                    value={formData.tipoGas || ''}
                    onChange={(e) => setFormData({ ...formData, tipoGas: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="R-410A">R-410A</option>
                    <option value="R-32">R-32</option>
                    <option value="R-22">R-22 (Antiguo)</option>
                    <option value="R-134A">R-134A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.stock')} *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.minStock')} *
                  </label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.purchasePrice')} *
                  </label>
                  <input
                    type="number"
                    value={formData.precioCompra}
                    onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.salePrice')} *
                  </label>
                  <input
                    type="number"
                    value={formData.precioCliente}
                    onChange={(e) => setFormData({ ...formData, precioCliente: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.installationPrice')}
                  </label>
                  <input
                    type="number"
                    value={formData.precioInstalacion}
                    onChange={(e) => setFormData({ ...formData, precioInstalacion: e.target.value })}
                    step="1"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.status')}
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="disponible">{t('inventory.status.available')}</option>
                    <option value="reservado">{t('inventory.status.reserved')}</option>
                    <option value="vendido">{t('inventory.status.sold')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.location')}
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder={t('inventory.form.locationPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.form.provider')}
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inventory.form.features')}
                </label>
                <textarea
                  value={formData.caracteristicas}
                  onChange={(e) => setFormData({ ...formData, caracteristicas: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('inventory.form.featuresPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-lg">
                  {editingItem ? t('common.save') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Inventario