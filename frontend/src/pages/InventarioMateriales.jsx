import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/MainLayout'
import Pagination from '../components/Pagination'
import { Boxes, Filter, X } from 'lucide-react'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { isAuthenticated } from '../services/authService'
import {
  getMateriales,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  ajustarStock,
  getEstadisticas
} from '../services/materialInventarioService'

const CATEGORIAS = [
  'Cañerías',
  'Soportes y Fijaciones',
  'Cables Eléctricos',
  'Gas Refrigerante',
  'Aislantes',
  'Accesorios de Montaje',
  'Herramientas Consumibles',
  'Otros'
]

const UNIDADES = [
  'metros',
  'unidades',
  'kilogramos',
  'litros',
  'cajas',
  'rollos',
  'pares'
]

function InventarioMateriales() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ categoria: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [materialStock, setMaterialStock] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState(null)
  const ITEMS_PER_PAGE = 20
  const isFirstRender = useRef(true)

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad: '',
    precioNeto: '',
    precioConIVA: '',
    stock: 0,
    stockMinimo: 5,
    proveedor: '',
    codigoProducto: '',
    descripcion: ''
  })

  const [stockForm, setStockForm] = useState({
    cantidad: '',
    tipo: 'aumentar',
    motivo: ''
  })

  const fetchData = useCallback(async (page, search) => {
    try {
      setLoading(true)
      const [materialesData, stats] = await Promise.all([
        getMateriales({ page, limit: ITEMS_PER_PAGE, search: search || undefined }),
        getEstadisticas()
      ])

      if (materialesData.pagination) {
        setMateriales(materialesData.data)
        setPaginationInfo(materialesData.pagination)
      } else {
        setMateriales(materialesData)
        setPaginationInfo(null)
      }

      setEstadisticas(stats)
    } catch (error) {
      console.error('Error al cargar materiales:', error)
      toast.error('Error al cargar materiales')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        ...formData,
        precioNeto: parseFloat(formData.precioNeto),
        precioConIVA: formData.precioConIVA ? parseFloat(formData.precioConIVA) : parseFloat(formData.precioNeto) * 1.19,
        stock: parseInt(formData.stock),
        stockMinimo: parseInt(formData.stockMinimo)
      }

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, dataToSend)
        toast.success('Material actualizado exitosamente')
      } else {
        await createMaterial(dataToSend)
        toast.success('Material creado exitosamente')
      }

      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al guardar material')
    }
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setFormData({
      nombre: material.nombre,
      categoria: material.categoria,
      unidad: material.unidad,
      precioNeto: material.precioNeto,
      precioConIVA: material.precioConIVA,
      stock: material.stock,
      stockMinimo: material.stockMinimo,
      proveedor: material.proveedor || '',
      codigoProducto: material.codigoProducto || '',
      descripcion: material.descripcion || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este material?')) {
      return
    }

    try {
      await deleteMaterial(id)
      toast.success('Material eliminado exitosamente')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al eliminar material')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMaterial(null)
    setFormData({
      nombre: '',
      categoria: '',
      unidad: '',
      precioNeto: '',
      precioConIVA: '',
      stock: 0,
      stockMinimo: 5,
      proveedor: '',
      codigoProducto: '',
      descripcion: ''
    })
  }

  const handleOpenStockModal = (material) => {
    setMaterialStock(material)
    setStockForm({
      cantidad: '',
      tipo: 'aumentar',
      motivo: ''
    })
    setShowStockModal(true)
  }

  const handleAjustarStock = async (e) => {
    e.preventDefault()

    try {
      await ajustarStock(
        materialStock.id,
        parseInt(stockForm.cantidad),
        stockForm.tipo,
        stockForm.motivo
      )

      toast.success(`Stock ${stockForm.tipo === 'aumentar' ? 'aumentado' : 'disminuido'} exitosamente`)
      fetchData()
      setShowStockModal(false)
      setMaterialStock(null)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.error || 'Error al ajustar stock')
    }
  }

  const handlePrecioNetoChange = (value) => {
    const neto = value ? parseFloat(value) : 0
    setFormData({
      ...formData,
      precioNeto: value,
      precioConIVA: neto > 0 ? (neto * 1.19).toFixed(2) : ''
    })
  }

  const handlePrecioConIVAChange = (value) => {
    const conIVA = value ? parseFloat(value) : 0
    setFormData({
      ...formData,
      precioConIVA: value,
      precioNeto: conIVA > 0 ? (conIVA / 1.19).toFixed(2) : ''
    })
  }



  const getCategoriaColor = (categoria) => {
    const colores = {
      'Cañerías': 'bg-blue-100 text-blue-800',
      'Soportes y Fijaciones': 'bg-purple-100 text-purple-800',
      'Cables Eléctricos': 'bg-yellow-100 text-yellow-800',
      'Gas Refrigerante': 'bg-green-100 text-green-800',
      'Aislantes': 'bg-pink-100 text-pink-800',
      'Accesorios de Montaje': 'bg-indigo-100 text-indigo-800',
      'Herramientas Consumibles': 'bg-orange-100 text-orange-800',
      'Otros': 'bg-gray-100 text-gray-800'
    }
    return colores[categoria] || 'bg-gray-100 text-gray-800'
  }

  const getStockBadge = (material) => {
    if (material.stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Sin stock</span>
    }
    if (material.stock <= material.stockMinimo) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Stock bajo</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Disponible</span>
  }

  const clearFilters = () => {
    setFilters({ categoria: '' })
  }

  // Datos del servidor + filtros locales
  const filteredMateriales = materiales.filter(material => {
    const matchesCategoria = !filters.categoria || material.categoria === filters.categoria
    return matchesCategoria
  })

  if (loading && materiales.length === 0) {
    return <LoadingSkeleton accentColor="green" rows={8} columns={6} showStats={true} statCards={4} />
  }

  return (
    <MainLayout>
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 backdrop-blur-sm bg-white/80">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Boxes className="text-white" size={22} />
                </div>
                Inventario de Materiales
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Control de materiales y consumibles • Total: {paginationInfo ? paginationInfo.total : materiales.length} items
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Agregar Material
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Materiales</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.activos}</p>
                </div>
                <Package className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.stockBajo}</p>
                </div>
                <AlertTriangle className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.sinStock}</p>
                </div>
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${estadisticas.valorTotal.toLocaleString('es-CL')}
                  </p>
                </div>
                <Package className="text-green-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${showFilters ? 'bg-green-600 text-white shadow-lg' : 'border border-gray-200 hover:bg-gray-50'}`}
            >
              <Filter size={20} />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 pt-4 mt-4 border-t border-gray-200 items-center">
              <select
                value={filters.categoria}
                onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {filters.categoria && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  <X size={16} />
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMateriales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No hay materiales registrados
                    </td>
                  </tr>
                ) : (
                  filteredMateriales.map((material) => (
                    <tr key={material.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{material.nombre}</div>
                        {material.codigoProducto && (
                          <div className="text-sm text-gray-500">Código: {material.codigoProducto}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoriaColor(material.categoria)}`}>
                          {material.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{material.stock} {material.unidad}</span>
                          {getStockBadge(material)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">
                          ${material.precioConIVA.toLocaleString('es-CL')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Neto: ${material.precioNeto.toLocaleString('es-CL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {material.proveedor || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenStockModal(material)}
                            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                            title="Ajustar stock"
                          >
                            <Package size={18} />
                          </button>

                          <button
                            onClick={() => handleEdit(material)}
                            className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(material.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingMaterial ? 'Editar Material' : 'Agregar Material'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad *
                  </label>
                  <select
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {UNIDADES.map(unidad => (
                      <option key={unidad} value={unidad}>{unidad}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Neto *
                  </label>
                  <input
                    type="number"
                    value={formData.precioNeto}
                    onChange={(e) => handlePrecioNetoChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio con IVA
                  </label>
                  <input
                    type="number"
                    value={formData.precioConIVA}
                    onChange={(e) => handlePrecioConIVAChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Ingresa el precio neto o con IVA; el sistema calculará automáticamente el otro valor.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Producto
                  </label>
                  <input
                    type="text"
                    value={formData.codigoProducto}
                    onChange={(e) => setFormData({ ...formData, codigoProducto: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg"
                >
                  {editingMaterial ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Stock */}
      {showStockModal && materialStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Ajustar Stock
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{materialStock.nombre}</p>
              <p className="text-sm text-gray-600">Stock actual: {materialStock.stock} {materialStock.unidad}</p>
            </div>

            <form onSubmit={handleAjustarStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ajuste
                </label>
                <select
                  value={stockForm.tipo}
                  onChange={(e) => setStockForm({ ...stockForm, tipo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="aumentar">➕ Aumentar Stock</option>
                  <option value="disminuir">➖ Disminuir Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={stockForm.cantidad}
                  onChange={(e) => setStockForm({ ...stockForm, cantidad: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={stockForm.motivo}
                  onChange={(e) => setStockForm({ ...stockForm, motivo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Ej: Compra, Uso en instalación, Ajuste de inventario..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false)
                    setMaterialStock(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg"
                >
                  Ajustar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default InventarioMateriales
