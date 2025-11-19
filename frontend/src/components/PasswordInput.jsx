// ============================================
// COMPONENTE: PasswordInput con Validación
// Ubicación: frontend/src/components/PasswordInput.jsx
// ============================================

import { useState } from 'react'

const PasswordInput = ({ value, onChange, label = "Contraseña", placeholder = "Ingresa tu contraseña" }) => {
  const [showPassword, setShowPassword] = useState(false)

  // Validación de contraseña
  const validatePassword = (password) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    }
  }

  const validation = validatePassword(value)
  const isValid = validation.minLength && validation.hasUpperCase && validation.hasLowerCase && validation.hasNumber

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          placeholder={placeholder}
          required
        />
        
        {/* Botón para mostrar/ocultar contraseña */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Indicadores de validación */}
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">
            Requisitos de contraseña:
          </p>
          
          <div className="space-y-1">
            <RequirementItem 
              isValid={validation.minLength}
              text="Mínimo 8 caracteres"
            />
            <RequirementItem 
              isValid={validation.hasUpperCase}
              text="Al menos una letra mayúscula (A-Z)"
            />
            <RequirementItem 
              isValid={validation.hasLowerCase}
              text="Al menos una letra minúscula (a-z)"
            />
            <RequirementItem 
              isValid={validation.hasNumber}
              text="Al menos un número (0-9)"
            />
          </div>

          {isValid && (
            <div className="flex items-center mt-2 text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Contraseña válida</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente auxiliar para cada requisito
const RequirementItem = ({ isValid, text }) => {
  return (
    <div className="flex items-center text-xs">
      {isValid ? (
        <svg className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span className={isValid ? 'text-green-600' : 'text-gray-600'}>
        {text}
      </span>
    </div>
  )
}

export default PasswordInput