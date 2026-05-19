import Link from 'next/link'
import { MapPin, Cpu, Wifi, WifiOff, Trash2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Portal, PortalStatus } from '@/lib/types'

interface PortalCardProps {
  portal: Portal
  liveStatus?: PortalStatus | null
  onDelete?: () => void
}

export function PortalCard({ portal, liveStatus, onDelete }: PortalCardProps) {
  const status = liveStatus?.status ?? portal.status ?? 'offline'
  const lastSeen = portal.last_seen
    ? formatDistanceToNow(new Date(portal.last_seen), { addSuffix: true, locale: es })
    : '—'

  return (
    <Link
      href={`/portals/${portal.id}`}
      className="block bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5 hover:border-[#8B7FF5]/30 hover:bg-[#13131F] transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate group-hover:text-[#8B7FF5] transition-colors">
            {portal.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{portal.portal_id}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          {onDelete && (
            <button
              onClick={e => { e.preventDefault(); onDelete() }}
              className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Eliminar portal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {portal.location && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{portal.location}{portal.country ? `, ${portal.country}` : ''}</span>
          </div>
        )}

        {liveStatus && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>CPU {liveStatus.cpu_usage ?? 0}% &middot; RAM {liveStatus.memory_usage ?? 0}%</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {liveStatus?.network_ok ? (
            <Wifi className="w-3.5 h-3.5 shrink-0 text-teal-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 shrink-0 text-red-400" />
          )}
          <span className="truncate">Visto {lastSeen}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1A1A2E] flex items-center justify-between">
        <span className="text-xs text-gray-600 bg-[#09090F] px-2 py-0.5 rounded font-mono">
          {portal.app_mode ?? 'default'}
        </span>
        {liveStatus?.app_running !== undefined && (
          <span className={`text-xs ${liveStatus.app_running ? 'text-teal-400' : 'text-gray-500'}`}>
            {liveStatus.app_running ? 'App activa' : 'App detenida'}
          </span>
        )}
      </div>
    </Link>
  )
}
