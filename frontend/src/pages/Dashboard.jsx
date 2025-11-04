import { useTranslation } from 'react-i18next'
import { Users, Wrench, ClipboardList, CheckCircle } from 'lucide-react'

function Dashboard() {
  const { t } = useTranslation()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.title')}
          </h1>
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
            Bienvenido al Sistema de Gestión
          </h2>
          <p className="text-gray-600">
            Este es el dashboard principal. Aquí verás las estadísticas y datos importantes de tu negocio.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
