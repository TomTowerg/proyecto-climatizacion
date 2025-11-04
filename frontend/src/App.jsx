import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import Clientes from './pages/Clientes'
import Equipos from './pages/Equipos'
import OrdenesTrabajo from './pages/OrdenesTrabajo'
import Inventario from './pages/Inventario'
import Cotizaciones from './pages/Cotizaciones'
import PruebaIA from './pages/PruebaIA'
import ChatAsistente from './components/ChatAsistente'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/ordenes-trabajo" element={<OrdenesTrabajo />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/prueba-ia" element={<PruebaIA />} />
        </Routes>
        
        {/* Chat Asistente Flotante - Disponible en todas las páginas */}
        <ChatAsistente />
      </div>
    </Router>
  )
}

export default App