// ============================================
// UTILIDAD DE PAGINACIÓN RETROCOMPATIBLE
// backend/src/utils/pagination.js
// ============================================

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/**
 * Extrae y valida parámetros de paginación del query string.
 * Si no se envían params, retorna null (sin paginar = retrocompatible).
 *
 * @param {object} query - req.query
 * @returns {object|null} { skip, take, page, limit } o null si no se paginó
 */
export function parsePagination(query) {
    const { page, limit } = query

    // Si no se enviaron parámetros de paginación, retornar null (retrocompatible)
    if (!page && !limit) return null

    const parsedPage = Math.max(1, parseInt(page) || 1)
    const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit) || DEFAULT_LIMIT))

    return {
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
        page: parsedPage,
        limit: parsedLimit
    }
}

/**
 * Construye la respuesta paginada con metadata.
 *
 * @param {Array} data - Resultados de la query
 * @param {number} total - Total de registros
 * @param {object} pagination - Resultado de parsePagination
 * @returns {object} { data, pagination: { total, page, limit, totalPages } }
 */
export function paginatedResponse(data, total, pagination) {
    return {
        data,
        pagination: {
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit)
        }
    }
}

/**
 * Extrae y sanitiza el parámetro de búsqueda del query string.
 * Retorna null si no se envía búsqueda (retrocompatible).
 *
 * @param {object} query - req.query
 * @returns {string|null} Término de búsqueda sanitizado o null
 */
export function parseSearch(query) {
    const { search } = query
    if (!search || typeof search !== 'string') return null

    const sanitized = search.trim()
    if (sanitized.length === 0) return null

    return sanitized
}
