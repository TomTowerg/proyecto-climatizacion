import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  pendiente: '#EAB308',
  aprobada: '#22C55E',
  rechazada: '#EF4444'
}

function GraficoCotizaciones({ stats }) {
  if (!stats) return null

  const data = [
    { name: 'Pendientes', value: stats.pendientes, color: COLORS.pendiente },
    { name: 'Aprobadas', value: stats.aprobadas, color: COLORS.aprobada },
    { name: 'Rechazadas', value: stats.rechazadas, color: COLORS.rechazada }
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de cotizaciones
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default GraficoCotizaciones