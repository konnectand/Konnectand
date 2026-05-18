'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from './StatusBadge'
import type { RoleName } from '@/lib/types'

interface PortalRow {
  id: string
  name: string
  portal_id: string
  status: string
  location: string
  client_id: string
  clients?: { name: string } | { name: string }[] | null
}

interface PortalStatusRow {
  portal_id: string
  status: string
  cpu_usage: number
  memory_usage: number
  app_running: boolean
  updated_at: string
}

interface Props {
  initialPortals: PortalRow[]
  userRole: RoleName
  clientId: string | null
}

export function RealtimeDashboard({ initialPortals, userRole, clientId }: Props) {
  const [statuses, setStatuses] = useState<Record<string, PortalStatusRow>>({})

  useEffect(() => {
    const supabase = createClient()
    const portalIds = initialPortals.map(p => p.id)

    if (portalIds.length > 0) {
      supabase
        .from('portal_status')
        .select('*')
        .in('portal_id', portalIds)
        .then(({ data }) => {
          if (data) {
            const map: Record<string, PortalStatusRow> = {}
            data.forEach(s => { map[s.portal_id] = s })
            setStatuses(map)
          }
        })
    }

    const channel = supabase
      .channel('dashboard_status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portal_status' },
        payload => {
          const row = payload.new as PortalStatusRow
          if (portalIds.includes(row.portal_id)) {
            setStatuses(prev => ({ ...prev, [row.portal_id]: row }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialPortals])

  if (initialPortals.length === 0) return null

  return (
    <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl">
      <div className="px-5 py-4 border-b border-[#1A1A2E]">
        <h2 className="text-sm font-semibold text-white">Estado de portales</h2>
        <p className="text-xs text-gray-500 mt-0.5">Tiempo real &middot; se actualiza automaticamente</p>
      </div>

      <div className="divide-y divide-[#1A1A2E]">
        {initialPortals.slice(0, 8).map(portal => {
          const live = statuses[portal.id]
          const currentStatus = live?.status ?? portal.status ?? 'offline'

          return (
            <Link
              key={portal.id}
              href={`/portals/${portal.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors"
            >
              <StatusBadge status={currentStatus} showLabel={false} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{portal.name}</p>
                {portal.clients && !Array.isArray(portal.clients) && portal.clients.name && (
                  <p className="text-xs text-gray-500 truncate">{portal.clients.name}</p>
                )}
                {portal.clients && Array.isArray(portal.clients) && portal.clients[0]?.name && (
                  <p className="text-xs text-gray-500 truncate">{portal.clients[0].name}</p>
                )}
              </div>

              {live && (
                <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                  <span>CPU <span className="text-gray-300">{live.cpu_usage}%</span></span>
                  <span>RAM <span className="text-gray-300">{live.memory_usage}%</span></span>
                  <span className={live.app_running ? 'text-teal-400' : 'text-gray-600'}>
                    {live.app_running ? 'App activa' : 'App detenida'}
                  </span>
                </div>
              )}

              <StatusBadge status={currentStatus} size="sm" />
            </Link>
          )
        })}
      </div>

      {initialPortals.length > 8 && (
        <div className="px-5 py-3 border-t border-[#1A1A2E]">
          <Link href="/portals" className="text-xs text-[#8B7FF5] hover:underline">
            Ver todos los portales ({initialPortals.length}) &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
