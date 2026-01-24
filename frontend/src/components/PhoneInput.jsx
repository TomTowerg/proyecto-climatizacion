import { useState, useEffect } from 'react'

/**
 * PhoneInput - Componente para ingresar teléfono con selector de país
 * 
 * Características:
 * - Selector de país con bandera y código
 * - Formateo automático según el país
 * - Validación de longitud
 * - Ejemplo: +56 9 1234 5678
 * 
 * Props:
 * @param {string} value - Valor del teléfono completo (ej: "+56912345678")
 * @param {function} onChange - Callback que recibe el teléfono completo
 * @param {string} defaultCountry - Código del país por defecto (ej: "CL")
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} required - Si el campo es requerido
 */

// Base de datos de países
const COUNTRIES = [
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', format: '9 XXXX XXXX', length: 9 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', format: '9 11 XXXX XXXX', length: 10 },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷', format: '11 9XXXX XXXX', length: 11 },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪', format: '9XX XXX XXX', length: 9 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', format: '3XX XXX XXXX', length: 10 },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽', format: '55 XXXX XXXX', length: 10 },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸', format: '(XXX) XXX-XXXX', length: 10 },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸', format: '6XX XX XX XX', length: 9 },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾', format: '9X XXX XXX', length: 8 },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾', format: '9XX XXX XXX', length: 9 },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', format: '7XX XX XXX', length: 8 },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', format: '9XX XXX XXX', length: 9 },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', format: '4XX XXX XXXX', length: 10 },
]

function PhoneInput({ value = '', onChange, defaultCountry = 'CL', className = '', required = false, ...props }) {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryList, setShowCountryList] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Inicializar con el valor prop
  useEffect(() => {
    if (value && value.startsWith('+')) {
      // Parsear el valor inicial
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode))
      if (country) {
        setSelectedCountry(country)
        const number = value.replace(country.dialCode, '').replace(/\s/g, '')
        setPhoneNumber(number)
      }
    }
  }, [])

  // Formatear número según el país
  const formatPhoneNumber = (number, country) => {
    const cleaned = number.replace(/\D/g, '')
    
    // Limitar a la longitud del país
    const limited = cleaned.slice(0, country.length)
    
    // Formatear según el país
    switch (country.code) {
      case 'CL': // Chile: 9 1234 5678
        if (limited.length <= 1) return limited
        if (limited.length <= 5) return `${limited.slice(0, 1)} ${limited.slice(1)}`
        return `${limited.slice(0, 1)} ${limited.slice(1, 5)} ${limited.slice(5, 9)}`
      
      case 'US': // USA: (123) 456-7890
        if (limited.length <= 3) return limited
        if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6, 10)}`
      
      case 'AR': // Argentina: 9 11 1234 5678
        if (limited.length <= 1) return limited
        if (limited.length <= 3) return `${limited.slice(0, 1)} ${limited.slice(1)}`
        if (limited.length <= 7) return `${limited.slice(0, 1)} ${limited.slice(1, 3)} ${limited.slice(3)}`
        return `${limited.slice(0, 1)} ${limited.slice(1, 3)} ${limited.slice(3, 7)} ${limited.slice(7, 11)}`
      
      case 'BR': // Brasil: 11 91234 5678
        if (limited.length <= 2) return limited
        if (limited.length <= 7) return `${limited.slice(0, 2)} ${limited.slice(2)}`
        return `${limited.slice(0, 2)} ${limited.slice(2, 7)} ${limited.slice(7, 11)}`
      
      default: // Formato genérico con espacios cada 3-4 dígitos
        if (limited.length <= 3) return limited
        if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`
        if (limited.length <= 9) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`
        return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`
    }
  }

  // Manejar cambios en el input
  const handlePhoneChange = (e) => {
    const input = e.target.value
    const cleaned = input.replace(/\D/g, '')
    
    // Limitar a la longitud del país
    if (cleaned.length > selectedCountry.length) return
    
    const formatted = formatPhoneNumber(cleaned, selectedCountry)
    setPhoneNumber(formatted)
    
    // Devolver el número completo al padre
    const fullNumber = `${selectedCountry.dialCode}${cleaned}`
    onChange(fullNumber)
  }

  // Cambiar país
  const handleCountryChange = (country) => {
    setSelectedCountry(country)
    setPhoneNumber('')
    setShowCountryList(false)
    onChange(country.dialCode)
  }

  // Filtrar países por búsqueda
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  )

  // Validar longitud
  const isValid = phoneNumber.replace(/\D/g, '').length === selectedCountry.length

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Selector de país */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCountryList(!showCountryList)}
            className="flex items-center gap-2 px-3 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white min-w-[120px]"
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Lista de países */}
          {showCountryList && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
              {/* Buscador */}
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Lista scrolleable */}
              <div className="overflow-y-auto max-h-64">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 transition-colors text-left ${
                      selectedCountry.code === country.code ? 'bg-blue-100' : ''
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{country.name}</div>
                      <div className="text-xs text-gray-500">{country.dialCode}</div>
                    </div>
                    {selectedCountry.code === country.code && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </button>
                ))}

                {filteredCountries.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No se encontraron países
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input de teléfono */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={selectedCountry.format}
            className={`${className} ${
              phoneNumber && !isValid ? 'border-yellow-400 focus:ring-yellow-400' : ''
            } ${
              phoneNumber && isValid ? 'border-green-500 focus:ring-green-500' : ''
            }`}
            required={required}
            {...props}
          />

          {/* Indicador de validación */}
          {phoneNumber && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <span className="text-green-500 text-xl">✓</span>
              ) : (
                <span className="text-yellow-500 text-sm">
                  {phoneNumber.replace(/\D/g, '').length}/{selectedCountry.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hint del formato */}
      <p className="text-xs text-gray-500 mt-1">
        Formato: {selectedCountry.dialCode} {selectedCountry.format}
      </p>

      {/* Click outside para cerrar */}
      {showCountryList && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCountryList(false)
            setSearchTerm('')
          }}
        />
      )}
    </div>
  )
}

export default PhoneInput
