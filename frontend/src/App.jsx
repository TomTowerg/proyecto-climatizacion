import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Equipos from './pages/Equipos'
import OrdenesTrabajo from './pages/OrdenesTrabajo'
import Inventario from './pages/Inventario'
import Cotizaciones from './pages/Cotizaciones'
import CalendarioOT from './pages/CalendarioOT'
import StockPanel from './pages/StockPanel'
import { isAuthenticated } from './services/authService'
import './index.css'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }
  return children
}

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
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Rutas Protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipos"
            element={
              <ProtectedRoute>
                <Equipos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordenes-trabajo"
            element={
              <ProtectedRoute>
                <OrdenesTrabajo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cotizaciones"
            element={
              <ProtectedRoute>
                <Cotizaciones />
              </ProtectedRoute>
            }
          />
          
          {/* ⭐ NUEVAS RUTAS - FASE 2 */}
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <CalendarioOT />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-panel"
            element={
              <ProtectedRoute>
                <StockPanel />
              </ProtectedRoute>
            }
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App