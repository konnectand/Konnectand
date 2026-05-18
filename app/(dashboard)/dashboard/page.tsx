import { requireAuth, isKonnectANDStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/KPICard'
import { StatusBadge } from '@/components/StatusBadge'
import { RealtimeDashboard } from '@/components/RealtimeDashboard'
import { Monitor, CheckCircle, XCircle, AlertTriangle, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  let portalQuery = supabase
    .from('portals')
    .select('id, name, portal_id, status, location, client_id, clients(name)')

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    portalQuery = portalQuery.eq('client_id', user.client_id)
  }

  const { data: portals } = await portalQuery
  const total   = portals?.length ?? 0
  const online  = portals?.filter(p => p.status === 'online').length ?? 0
  const offline = portals?.filter(p => p.status === 'offline').length ?? 0
  const alert   = portals?.filter(p => p.status === 'alert').length ?? 0

  let logsQuery = supabase
    .from('portal_logs')
    .select('id, portal_id, level, message, created_at, portals(name, portal_id)')
    .in('level', ['error', 'critical'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    const portalIds = portals?.map(p => p.id) ?? []
    if (portalIds.length > 0) {
      logsQuery = logsQuery.in('portal_id', portalIds)
    }
  }

  const { data: criticalLogs } = await logsQuery

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Panel principal</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Resumen global &middot; actualizacion en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total portales"
          value={total}
          icon={Monitor}
          color="purple"
          subtitle="Todos los dispositivos"
        />
        <KPICard
          title="En linea"
          value={online}
          icon={CheckCircle}
          color="teal"
          subtitle={total > 0 ? `${Math.round((online / total) * 100)}% del total` : '—'}
        />
        <KPICard
          title="Fuera de linea"
          value={offline}
          icon={XCircle}
          color="danger"
        />
        <KPICard
          title="Con alerta"
          value={alert}
          icon={AlertTriangle}
          color="gold"
        />
      </div>

      <RealtimeDashboard initialPortals={portals ?? []} userRole={user.role} clientId={user.client_id} />

      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A2E]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F0B429]" />
            <h2 className="text-sm font-semibold text-white">Alertas recientes</h2>
          </div>
          <span className="text-xs text-gray-500">{criticalLogs?.length ?? 0} eventos</span>
        </div>

        {!criticalLogs || criticalLogs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle className="w-8 h-8 text-[#2DD4A8] mx-auto mb-2 opacity-60" />
            <p className="text-sm text-gray-500">Sin alertas criticas recientes</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A2E]">
            {criticalLogs.map((log: any) => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-4 hover:bg-white/2 transition-colors">
                <div className="shrink-0 mt-0.5">
                  {log.level === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/portals/${log.portal_id}`}
                      className="text-xs font-medium text-[#8B7FF5] hover:underline truncate"
                    >
                      {log.portals?.name ?? log.portals?.portal_id ?? log.portal_id}
                    </Link>
                    <StatusBadge status={log.level} size="sm" />
                  </div>
                  <p className="text-sm text-gray-300 truncate">{log.message}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0 whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
