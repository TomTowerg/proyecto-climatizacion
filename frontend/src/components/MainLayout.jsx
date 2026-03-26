import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

/**
 * Layout Principal con Sidebar
 * Envuelve todas las páginas del dashboard
 */
function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header móvil — solo visible en pantallas pequeñas */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] flex items-center px-4 gap-3 z-40 shadow-lg">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
            <img
              src="/logo-kmts.png"
              alt="KMTS"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<span class="text-indigo-900 font-bold text-sm">K</span>'
              }}
            />
          </div>
          <span className="text-white font-bold text-base tracking-tight">KMTS</span>
        </Link>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido principal */}
      <div className="flex-1 md:ml-64 w-full pt-14 md:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
