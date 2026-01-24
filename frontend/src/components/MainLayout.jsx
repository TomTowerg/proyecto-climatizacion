import Sidebar from './Sidebar'

/**
 * Layout Principal con Sidebar
 * Envuelve todas las páginas del dashboard
 */
function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />
      
      {/* Contenido principal con margen para el sidebar */}
      <div className="flex-1 ml-64">
        {/* Contenedor con padding y scroll */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
