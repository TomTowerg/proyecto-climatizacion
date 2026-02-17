import MainLayout from './MainLayout'

/**
 * Skeleton loader para páginas de lista (tabla).
 * Muestra la silueta del header, barra de búsqueda, y filas de tabla.
 * 
 * @param {string} accentColor - Color Tailwind para el acento (ej: 'indigo', 'cyan', 'emerald')
 * @param {number} rows - Cantidad de filas skeleton a mostrar
 * @param {number} columns - Cantidad de columnas por fila
 * @param {boolean} showStats - Mostrar tarjetas de estadísticas skeleton
 * @param {number} statCards - Cantidad de tarjetas de stats
 */
function LoadingSkeleton({
    accentColor = 'indigo',
    rows = 8,
    columns = 5,
    showStats = false,
    statCards = 4
}) {
    return (
        <MainLayout>
            {/* Header skeleton */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${accentColor}-200 rounded-xl skeleton-pulse`}></div>
                            <div>
                                <div className="h-6 w-48 bg-gray-200 rounded-lg skeleton-pulse"></div>
                                <div className="h-4 w-64 bg-gray-100 rounded-lg mt-2 skeleton-pulse delay-100"></div>
                            </div>
                        </div>
                        <div className="h-10 w-36 bg-gray-200 rounded-lg skeleton-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Stats skeleton */}
                {showStats && (
                    <div className={`grid grid-cols-${statCards > 4 ? 5 : statCards} gap-6 mb-8`}>
                        {Array.from({ length: statCards }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg skeleton-pulse"></div>
                                    <div>
                                        <div className="h-4 w-20 bg-gray-200 rounded skeleton-pulse"></div>
                                        <div className="h-7 w-12 bg-gray-100 rounded mt-2 skeleton-pulse delay-100"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search bar skeleton */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 h-12 bg-gray-100 rounded-xl skeleton-pulse"></div>
                        <div className="h-12 w-28 bg-gray-100 rounded-xl skeleton-pulse delay-100"></div>
                    </div>
                </div>

                {/* Table skeleton */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-4">
                        <div className="flex gap-4">
                            {Array.from({ length: columns }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-4 bg-gray-200 rounded skeleton-pulse"
                                    style={{ flex: i === 0 ? 2 : 1, animationDelay: `${i * 50}ms` }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Table rows */}
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="px-4 py-4 border-b border-gray-50 flex gap-4 items-center"
                            style={{ opacity: 1 - (rowIndex * 0.08) }}
                        >
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div
                                    key={colIndex}
                                    className="h-4 bg-gray-100 rounded skeleton-pulse"
                                    style={{
                                        flex: colIndex === 0 ? 2 : 1,
                                        animationDelay: `${(rowIndex * 80) + (colIndex * 40)}ms`
                                    }}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    )
}

export default LoadingSkeleton
