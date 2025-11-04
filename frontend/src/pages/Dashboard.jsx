import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Wrench, ClipboardList, CheckCircle, LogOut } from 'lucide-react'
import { getUser, logout, isAuthenticated } from '../services/authService'
import toast from 'react-hot-toast'

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

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada correctamente')
    navigate('/')
  }

  const stats = [
    {
      title: t('dashboard.totalClients'),
      value: '0',
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: t('dashboard.totalEquipment'),
      value: '0',
      icon: Wrench,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: t('dashboard.monthOrders'),
      value: '0',
      icon: ClipboardList,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: t('dashboard.completedMaintenance'),
      value: '0',
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Bienvenido, {user.name || user.username || user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={20} />
            {t('auth.logout')}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
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