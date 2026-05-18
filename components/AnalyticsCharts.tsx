'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'

interface Props {
  activityData: { date: string; count: number }[]
  eventTypeData: { type: string; count: number }[]
  portalActivity: { name: string; events: number; status: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  online:  '#2DD4A8',
  offline: '#EF4444',
  alert:   '#F0B429',
  unknown: '#6b7280',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-lg px-3 py-2">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export function AnalyticsCharts({ activityData, eventTypeData, portalActivity }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-4">Actividad diaria (eventos)</h3>
        {activityData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sin datos de actividad</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#8B7FF5" strokeWidth={2}
                dot={{ fill: '#8B7FF5', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Tipos de eventos</h3>
        {eventTypeData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventTypeData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8B7FF5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Actividad por portal</h3>
        {portalActivity.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={portalActivity} margin={{ top: 0, right: 8, bottom: 30, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="events" radius={[4, 4, 0, 0]}>
                {portalActivity.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#8B7FF5'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#1A1A2E]">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              {status}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
