import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home, Users, Wind, ClipboardList, Package, FileText,
  Calendar, TrendingUp, Boxes, LogOut, ChevronDown,
  ChevronRight, Globe, Settings, Bell, User
} from 'lucide-react'
import { logout } from '../services/authService'

function Sidebar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState(null)
  const [userName, setUserName] = useState(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name || user.email || 'Usuario'
      }
    } catch (e) {
      return 'Usuario'
    }
    return 'Usuario'
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
    window.location.reload()
  }

  // Lógica inteligente para mantener el botón activo
  const isActive = (path) => {
    // Coincidencia exacta o subrutas con /
    if (location.pathname === path) return true

    // Para rutas con subrutas, verificar que siga un /
    // Esto evita que /inventario active /inventario-materiales
    if (location.pathname.startsWith(path + '/')) return true

    return false
  }

  // Estructura del menú con secciones organizadas
  const menuSections = [
    {
      id: 'main',
      title: null,
      items: [
        { path: '/dashboard', label: t('nav.dashboard'), icon: Home }
      ]
    },
    {
      id: 'ventas',
      title: 'Ventas',
      items: [
        { path: '/clientes', label: t('nav.clients'), icon: Users },
        { path: '/cotizaciones', label: t('nav.quotes'), icon: FileText }
      ]
    },
    {
      id: 'operaciones',
      title: 'Operaciones',
      items: [
        { path: '/ordenes-trabajo', label: t('nav.workOrders'), icon: ClipboardList },
        { path: '/equipos', label: t('nav.equipment'), icon: Wind }
      ]
    },
    {
      id: 'inventario',
      title: 'Inventario',
      items: [
        { path: '/inventario', label: t('nav.inventory'), icon: Package },
        { path: '/inventario-materiales', label: 'Materiales', icon: Boxes },
        { path: '/stock-panel', label: t('nav.stockPanel'), icon: TrendingUp }
      ]
    },
    {
      id: 'otros',
      title: null,
      items: [
        { path: '/calendario', label: t('nav.calendar'), icon: Calendar }
      ]
    }
  ]

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#3b82a0] text-white flex flex-col shadow-2xl z-50">
      {/* Logo / Header con efecto hover */}
      <div className="p-6 border-b border-cyan-700/20">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
            <img
              src="/logo-kmts.png"
              alt="KMTS"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                const parent = e.target.parentElement
                parent.innerHTML = '<span class="text-indigo-900 font-bold text-2xl">K</span>'
              }}
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight group-hover:text-blue-300 transition-colors">
              KMTS
            </h1>
            <p className="text-xs text-cyan-400 font-medium tracking-wide">Powertech SPA</p>
          </div>
        </Link>
      </div>

      {/* User Info Card - Nuevo */}
      <div className="px-4 py-3 border-b border-cyan-700/20">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-cyan-300">Administrator</p>
          </div>
          <Bell size={16} className="text-cyan-300 hover:text-cyan-100 transition-colors" />
        </div>
      </div>

      {/* Menu Items - Scroll personalizado */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuSections.map((section) => (
          <div key={section.id} className="mb-2">
            {/* Título de Sección */}
            {section.title && (
              <div className="px-4 py-2 text-[10px] font-bold text-cyan-400/70 uppercase tracking-widest mt-4 flex items-center gap-2">
                <div className="flex-1 h-px bg-cyan-700/20"></div>
                <span>{section.title}</span>
                <div className="flex-1 h-px bg-cyan-700/20"></div>
              </div>
            )}

            {/* Items del menú con animaciones mejoradas */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                      ${active
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 font-semibold scale-105'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className={`transition-all ${active
                          ? 'text-white'
                          : 'text-cyan-300 group-hover:text-white group-hover:scale-110'
                        }`}
                    />
                    <span className="text-sm">{item.label}</span>

                    {/* Indicador activo animado */}
                    {active && (
                      <div className="absolute right-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer con idioma y logout - Mejorado */}
      <div className="border-t border-cyan-700/20 p-4 space-y-2 bg-gradient-to-t from-[#1e3a5f]/80 to-transparent">
        {/* Selector de Idioma con mejor diseño */}
        <div className="relative">
          <button
            onClick={() => toggleSection('language')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cyan-500/10 text-slate-200 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Globe size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs text-cyan-300">Idioma</p>
                <p className="text-sm font-semibold">
                  {i18n.language === 'es' ? 'Español' : 'English'}
                </p>
              </div>
            </div>
            <div className="transition-transform duration-200" style={{ transform: expandedSection === 'language' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown size={16} />
            </div>
          </button>

          {/* Submenu de idiomas con animación suave */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: expandedSection === 'language' ? '200px' : '0',
              opacity: expandedSection === 'language' ? '1' : '0'
            }}
          >
            <div className="mt-2 ml-1 bg-slate-900/50 rounded-xl overflow-hidden border border-cyan-700/20 backdrop-blur-sm">
              <button
                onClick={() => changeLanguage('es')}
                className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${i18n.language === 'es'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg'
                    : 'text-slate-300 hover:bg-cyan-500/10'
                  }`}
              >
                <span className="text-lg">🇪🇸</span>
                <span>Español</span>
                {i18n.language === 'es' && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${i18n.language === 'en'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold shadow-lg'
                    : 'text-slate-300 hover:bg-cyan-500/10'
                  }`}
              >
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
                {i18n.language === 'en' && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Botón de Logout mejorado */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/30 hover:text-red-100 transition-all duration-200 group border border-transparent hover:border-red-500/30"
        >
          <div className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center group-hover:bg-red-900/50 transition-colors">
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-medium">{t('nav.logout')}</span>
        </button>
      </div>

      {/* CSS personalizado para el scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  )
}

export default Sidebar
