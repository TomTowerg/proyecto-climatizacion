import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Componente de paginación reutilizable.
 *
 * Props:
 * - currentPage: número de página actual (1-indexed)
 * - totalPages: total de páginas
 * - total: total de registros
 * - limit: registros por página
 * - onPageChange: callback (newPage) => void
 * - loading: boolean, deshabilita botones mientras carga
 */
function Pagination({ currentPage, totalPages, total, limit, onPageChange, loading }) {
    if (totalPages <= 1) return null

    const startRecord = (currentPage - 1) * limit + 1
    const endRecord = Math.min(currentPage * limit, total)

    // Generar rango de páginas visibles (máximo 5)
    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1)
        }

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
            {/* Info de registros */}
            <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{startRecord}-{endRecord}</span> de{' '}
                <span className="font-semibold text-gray-900">{total}</span> registros
            </p>

            {/* Controles de paginación */}
            <div className="flex items-center gap-1">
                {/* Primera página */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Primera página"
                >
                    <ChevronsLeft size={18} />
                </button>

                {/* Anterior */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Anterior"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Números de página */}
                {getPageNumbers().map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        disabled={loading}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pageNum === currentPage
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            } disabled:cursor-not-allowed`}
                    >
                        {pageNum}
                    </button>
                ))}

                {/* Siguiente */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Siguiente"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Última página */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Última página"
                >
                    <ChevronsRight size={18} />
                </button>
            </div>
        </div>
    )
}

export default Pagination
