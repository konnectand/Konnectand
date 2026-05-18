import { requireAuth, canSendCommands, isKonnectANDStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/StatusBadge'
import { RealtimePortalDetail } from '@/components/RealtimePortalDetail'
import { LogsStream } from '@/components/LogsStream'
import { CommandPanel } from '@/components/CommandPanel'
import { MapPin, Server, Calendar, Link2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function PortalDetailPage({ params }: Props) {
  const { id } = params
  const user = await requireAuth()
  const supabase = createClient()

  const { data: portal, error } = await supabase
    .from('portals')
    .select('*, clients(name, country, contact_email), portal_status(*)')
    .eq('id', id)
    .single()

  if (error || !portal) notFound()

  if (!isKonnectANDStaff(user.role) && user.client_id && portal.client_id !== user.client_id) {
    notFound()
  }

  const { data: initialLogs } = await supabase
    .from('portal_logs')
    .select('*')
    .eq('portal_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const initialStatus = portal.portal_status?.[0] ?? null
  const allowCommands = canSendCommands(user.role)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/portals" className="hover:text-[#8B7FF5] transition-colors">Portales</Link>
        <span>/</span>
        <span className="text-gray-300">{portal.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{portal.name}</h1>
            <StatusBadge status={initialStatus?.status ?? portal.status ?? 'offline'} />
          </div>
          <p className="text-sm text-gray-500 font-mono">{portal.portal_id}</p>
        </div>
        {portal.clients && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Cliente</p>
            <p className="text-sm text-white font-medium">{portal.clients.name}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Informacion del portal</h2>
            <dl className="space-y-3 text-sm">
              {portal.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-gray-500 text-xs">Ubicacion</dt>
                    <dd className="text-gray-200">{portal.location}{portal.country ? `, ${portal.country}` : ''}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Server className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 text-xs">Modo actual</dt>
                  <dd className="text-gray-200 font-mono">{portal.app_mode ?? '—'}</dd>
                </div>
              </div>
              {portal.paired_with && (
                <div className="flex items-start gap-3">
                  <Link2 className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-gray-500 text-xs">Emparejado con</dt>
                    <dd>
                      <Link href={`/portals/${portal.paired_with}`} className="text-[#8B7FF5] hover:underline text-sm">
                        Ver portal &rarr;
                      </Link>
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <dt className="text-gray-500 text-xs">Registrado</dt>
                  <dd className="text-gray-200">
                    {format(new Date(portal.created_at), 'dd MMM yyyy', { locale: es })}
                  </dd>
                </div>
              </div>
            </dl>

            {portal.hardware_info && Object.keys(portal.hardware_info).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1A1A2E]">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Hardware</p>
                <div className="space-y-1.5">
                  {Object.entries(portal.hardware_info).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-gray-300 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <RealtimePortalDetail portalId={id} initialStatus={initialStatus} />

          {allowCommands && (
            <CommandPanel portalId={id} portalName={portal.name} currentMode={portal.app_mode ?? ''} />
          )}
        </div>

        <div className="lg:col-span-2">
          <LogsStream portalId={id} initialLogs={initialLogs ?? []} />
        </div>
      </div>
    </div>
  )
}
