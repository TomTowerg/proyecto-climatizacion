// LISTA DE EMAILS PERMITIDOS - AGREGA LOS EMAILS QUE QUIERAS PERMITIR
export const ALLOWED_EMAILS = [
  'niveksar@gmail.com',
  'torres.tomas514@gmail.com',
  // Agrega más emails aquí
]

// Verificar si un email está permitido
export const isEmailAllowed = (email) => {
  return ALLOWED_EMAILS.includes(email.toLowerCase())
}

// Obtener dominio de un email
export const getEmailDomain = (email) => {
  return email.split('@')[1]
}

// Dominios permitidos (opcional - permite todo el dominio)
export const ALLOWED_DOMAINS = [
  // 'empresa.com',  // Descomentar para permitir todo @empresa.com
]

export const isDomainAllowed = (email) => {
  const domain = getEmailDomain(email)
  return ALLOWED_DOMAINS.includes(domain)
}