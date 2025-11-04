import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Wrench, ClipboardList, CheckCircle } from 'lucide-react'
import { getUser, isAuthenticated } from '../services/authService'
import Navbar from '../components/Navbar'
import { getEstadisticas } from '../services/ordenTrabajoService'

function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated()) {
      navigate('/')
      return
    }

    // Obtener usuario
    const userData = getUser()
    setUser(userData)
  }, [navigate])

const [stats, setStats] = useState({
  totalClientes: 0,
  totalEquipos: 0,
  ordenesMes: 0,
  mantenimientosCompletados: 0
})

useEffect(() => {
  // Verificar autenticación
  if (!isAuthenticated()) {
    navigate('/')
    return
  }

  // Obtener usuario
  const userData = getUser()
  setUser(userData)
  
  // Obtener estadísticas
  fetchEstadisticas()
}, [navigate])

const fetchEstadisticas = async () => {
  try {
    const data = await getEstadisticas()
    setStats(data)
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  }
}

const statsDisplay = [
  {
    title: t('dashboard.totalClients'),
    value: stats.totalClientes,
    icon: Users,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    title: t('dashboard.totalEquipment'),
    value: stats.totalEquipos,
    icon: Wrench,
    color: 'text-green-600 bg-green-100'
  },
  {
    title: t('dashboard.monthOrders'),
    value: stats.ordenesMes,
    icon: ClipboardList,
    color: 'text-purple-600 bg-purple-100'
  },
  {
    title: t('dashboard.completedMaintenance'),
    value: stats.mantenimientosCompletados,
    icon: CheckCircle,
    color: 'text-orange-600 bg-orange-100'
  }
]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Bienvenido, {user.name || user.username || user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => {

            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 card">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Información de Usuario
          </h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Email:</strong> {user.email}</p>
            {user.name && <p><strong>Nombre:</strong> {user.name}</p>}
            {user.username && <p><strong>Usuario:</strong> {user.username}</p>}
          </div>
        </div>

        <div className="mt-6 card">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Próximos Pasos
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>✅ Sistema de autenticación funcionando</li>
            <li>⏳ Implementar CRUD de Clientes</li>
            <li>⏳ Implementar CRUD de Equipos</li>
            <li>⏳ Implementar CRUD de Órdenes de Trabajo</li>
            <li>⏳ Agregar calendario de servicios</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default Dashboard