import { useState, useEffect } from 'react'

/**
 * RutInput - Componente para ingresar RUT chileno con formateo automático
 * 
 * Formatea automáticamente mientras el usuario escribe:
 * - Agrega puntos cada 3 dígitos
 * - Agrega guión antes del dígito verificador
 * - Valida el dígito verificador
 * - Ejemplo: 12.345.678-9
 * 
 * Props:
 * @param {string} value - Valor del RUT (puede estar formateado o no)
 * @param {function} onChange - Callback que recibe el RUT formateado
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} required - Si el campo es requerido
 * @param {boolean} showValidation - Mostrar indicador de validación
 */

function RutInput({ value = '', onChange, className = '', required = false, showValidation = true, ...props }) {
  const [rut, setRut] = useState('')
  const [isValid, setIsValid] = useState(null)

  // Inicializar con el valor prop
  useEffect(() => {
    if (value) {
      setRut(formatRut(value))
    }
  }, [])

  // Limpiar RUT (quitar puntos y guión)
  const cleanRut = (rut) => {
    return rut.replace(/[^0-9kK]/g, '').toUpperCase()
  }

  // Formatear RUT (agregar puntos y guión)
  const formatRut = (rut) => {
    const cleaned = cleanRut(rut)
    if (cleaned.length === 0) return ''

    // Separar número y dígito verificador
    const numero = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1)

    if (numero.length === 0) return cleaned

    // Agregar puntos cada 3 dígitos
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    // Agregar guión antes del DV
    return `${numeroFormateado}-${dv}`
  }

  // Validar RUT chileno
  const validarRut = (rut) => {
    const cleaned = cleanRut(rut)
    if (cleaned.length < 2) return false

    const numero = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1)

    // Calcular dígito verificador
    let suma = 0
    let multiplicador = 2

    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero.charAt(i)) * multiplicador
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
    }

    const dvEsperado = 11 - (suma % 11)
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()

    return dv === dvCalculado
  }

  // Manejar cambios en el input
  const handleChange = (e) => {
    const inputValue = e.target.value
    const cleaned = cleanRut(inputValue)

    // Limitar a 9 caracteres (8 dígitos + 1 DV)
    if (cleaned.length > 9) return

    const formatted = formatRut(cleaned)
    setRut(formatted)

    // Validar si tiene suficientes caracteres
    if (cleaned.length >= 2) {
      const valid = validarRut(cleaned)
      setIsValid(valid)
    } else {
      setIsValid(null)
    }

    // Devolver el RUT formateado al componente padre
    onChange(formatted)
  }

  // Determinar clases de validación
  const getValidationClasses = () => {
    if (!showValidation || isValid === null || rut.length === 0) return ''
    return isValid 
      ? 'border-green-500 focus:ring-green-500' 
      : 'border-red-500 focus:ring-red-500'
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={rut}
        onChange={handleChange}
        placeholder="12.345.678-9"
        className={`${className} ${getValidationClasses()}`}
        required={required}
        {...props}
      />
      
      {/* Indicador de validación */}
      {showValidation && rut.length > 0 && isValid !== null && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid ? (
            <span className="text-green-500 text-xl">✓</span>
          ) : (
            <span className="text-red-500 text-xl">✗</span>
          )}
        </div>
      )}

      {/* Mensaje de error */}
      {showValidation && rut.length > 0 && isValid === false && (
        <p className="text-xs text-red-600 mt-1">RUT inválido</p>
      )}
    </div>
  )
}

export default RutInput
