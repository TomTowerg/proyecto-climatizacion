/**
 * Valida un RUT chileno
 * @param {string} rut - RUT en formato XX.XXX.XXX-X o XXXXXXXX-X
 * @returns {boolean} - true si el RUT es válido
 */
export function validarRut(rut) {
  // Eliminar puntos y guión
  rut = rut.replace(/\./g, '').replace(/-/g, '')
  
  if (rut.length < 2) return false
  
  // Separar número y dígito verificador
  const rutNumero = parseInt(rut.slice(0, -1))
  const dv = rut.slice(-1).toUpperCase()
  
  // Calcular dígito verificador
  let suma = 0
  let multiplo = 2
  
  for (let i = rutNumero.toString().length - 1; i >= 0; i--) {
    suma += parseInt(rutNumero.toString()[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  
  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()
  
  return dv === dvCalculado
}

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado XX.XXX.XXX-X
 */
export function formatearRut(rut) {
  // Eliminar caracteres no numéricos excepto K
  rut = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  
  if (rut.length < 2) return rut
  
  // Separar número y dígito verificador
  const rutNumero = rut.slice(0, -1)
  const dv = rut.slice(-1)
  
  // Formatear con puntos
  let rutFormateado = rutNumero.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  
  return `${rutFormateado}-${dv}`
}