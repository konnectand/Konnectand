'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cpu, MemoryStick, Wifi, WifiOff, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PortalStatus } from '@/lib/types'

interface Props {
  portalId: string
  initialStatus: PortalStatus | null
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value || 0))
  return (
    <div className="w-full h-1.5 bg-[#09090F] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function RealtimePortalDetail({ portalId, initialStatus }: Props) {
  const [status, setStatus] = useState<PortalStatus | null>(initialStatus)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`portal_detail_${portalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portal_status', filter: `portal_id=eq.${portalId}` },
        payload => { setStatus(payload.new as PortalStatus) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [portalId])

  if (!status) {
    return (
      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
        <p className="text-sm text-gray-500 text-center py-4">Sin datos de estado disponibles</p>
      </div>
    )
  }

  const cpuHigh = (status.cpu_usage ?? 0) > 80
  const memHigh = (status.memory_usage ?? 0) > 80

  return (
    <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Estado en tiempo real</h2>
        <div className="flex items-center gap-1.5 text-xs text-teal-400">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 status-pulse" />
          Live
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400">CPU</span>
            </div>
            <span className={`text-xs font-mono font-medium ${cpuHigh ? 'text-red-400' : 'text-gray-300'}`}>
              {status.cpu_usage ?? 0}%
            </span>
          </div>
          <ProgressBar value={status.cpu_usage} color={cpuHigh ? 'bg-red-400' : 'bg-[#8B7FF5]'} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400">Memoria</span>
            </div>
            <span className={`text-xs font-mono font-medium ${memHigh ? 'text-red-400' : 'text-gray-300'}`}>
              {status.memory_usage ?? 0}%
            </span>
          </div>
          <ProgressBar value={status.memory_usage} color={memHigh ? 'bg-red-400' : 'bg-[#2DD4A8]'} />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2">
            {status.network_ok
              ? <Wifi className="w-4 h-4 text-teal-400" />
              : <WifiOff className="w-4 h-4 text-red-400" />}
            <span className={`text-xs ${status.network_ok ? 'text-teal-400' : 'text-red-400'}`}>
              {status.network_ok ? 'Red OK' : 'Sin red'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${status.app_running ? 'text-teal-400' : 'text-gray-500'}`} />
            <span className={`text-xs ${status.app_running ? 'text-teal-400' : 'text-gray-500'}`}>
              {status.app_running ? 'App activa' : 'App detenida'}
            </span>
          </div>
        </div>

        {status.last_heartbeat && (
          <p className="text-xs text-gray-600">
            Ultimo heartbeat{' '}
            {formatDistanceToNow(new Date(status.last_heartbeat), { addSuffix: true, locale: es })}
          </p>
        )}
      </div>
    </div>
  )
}
