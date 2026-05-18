import { requireAuth, isKonnectANDStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/KPICard'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { BarChart3, Clock, Activity, Zap } from 'lucide-react'
import { subDays, format } from 'date-fns'

export default async function AnalyticsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const since = subDays(new Date(), 30).toISOString()

  let portalsQuery = supabase.from('portals').select('id, name, client_id')
  if (!isKonnectANDStaff(user.role) && user.client_id) {
    portalsQuery = portalsQuery.eq('client_id', user.client_id)
  }
  const { data: portals } = await portalsQuery

  const portalIds = portals?.map(p => p.id) ?? []

  let analyticsQuery = supabase
    .from('analytics')
    .select('*')
    .gte('created_at', since)
    .order('created_at')

  if (portalIds.length > 0) {
    analyticsQuery = analyticsQuery.in('portal_id', portalIds)
  }

  const { data: analytics } = await analyticsQuery

  let statusQuery = supabase.from('portal_status').select('status, cpu_usage, memory_usage')
  if (portalIds.length > 0) {
    statusQuery = statusQuery.in('portal_id', portalIds)
  }
  const { data: statuses } = await statusQuery

  const totalEvents = analytics?.length ?? 0
  const avgDuration =
    analytics && analytics.length > 0
      ? Math.round(analytics.reduce((acc, a) => acc + (a.duration_seconds ?? 0), 0) / analytics.length)
      : 0

  const onlineCount = statuses?.filter(s => s.status === 'online').length ?? 0
  const totalPortals = portals?.length ?? 0
  const uptimePct = totalPortals > 0 ? Math.round((onlineCount / totalPortals) * 100) : 0

  const avgCpu = statuses && statuses.length > 0
    ? Math.round(statuses.reduce((acc, s) => acc + (s.cpu_usage ?? 0), 0) / statuses.length)
    : 0

  const dayMap: Record<string, number> = {}
  const eventTypeMap: Record<string, number> = {}

  analytics?.forEach(a => {
    const day = format(new Date(a.created_at), 'dd/MM')
    dayMap[day] = (dayMap[day] ?? 0) + 1
    eventTypeMap[a.event_type] = (eventTypeMap[a.event_type] ?? 0) + 1
  })

  const activityData = Object.entries(dayMap).map(([date, count]) => ({ date, count }))
  const eventTypeData = Object.entries(eventTypeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const portalActivity = portals?.map(p => {
    const pAnalytics = analytics?.filter(a => a.portal_id === p.id) ?? []
    const pStatus = statuses?.find((s: any) => s.portal_id === p.id)
    return {
      name: p.name.length > 14 ? p.name.slice(0, 14) + '...' : p.name,
      events: pAnalytics.length,
      status: pStatus?.status ?? 'unknown',
    }
  }).slice(0, 10) ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#8B7FF5]" />
          Analitica
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Ultimos 30 dias</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Eventos totales" value={totalEvents} icon={Activity} color="purple" />
        <KPICard
          title="Duracion media"
          value={`${avgDuration}s`}
          icon={Clock}
          color="teal"
          subtitle="Por sesion"
        />
        <KPICard
          title="Uptime actual"
          value={`${uptimePct}%`}
          icon={Zap}
          color={uptimePct > 80 ? 'teal' : uptimePct > 50 ? 'gold' : 'danger'}
          subtitle={`${onlineCount}/${totalPortals} portales en linea`}
        />
        <KPICard
          title="CPU media"
          value={`${avgCpu}%`}
          icon={BarChart3}
          color={avgCpu > 80 ? 'danger' : avgCpu > 60 ? 'gold' : 'gray'}
        />
      </div>

      <AnalyticsCharts
        activityData={activityData}
        eventTypeData={eventTypeData}
        portalActivity={portalActivity}
      />
    </div>
  )
}
