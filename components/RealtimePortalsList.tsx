'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortalCard } from './PortalCard'
import { Search } from 'lucide-react'
import type { Portal, PortalStatus } from '@/lib/types'

interface Props {
  initialPortals: Portal[]
}

type StatusFilter = 'all' | 'online' | 'offline' | 'alert'

export function RealtimePortalsList({ initialPortals }: Props) {
  const [statuses, setStatuses] = useState<Record<string, PortalStatus>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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
            const map: Record<string, PortalStatus> = {}
            data.forEach(s => { map[s.portal_id] = s })
            setStatuses(map)
          }
        })
    }

    const channel = supabase
      .channel('portals_list_status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portal_status' },
        payload => {
          const row = payload.new as PortalStatus
          if (portalIds.includes(row.portal_id)) {
            setStatuses(prev => ({ ...prev, [row.portal_id]: row }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialPortals])

  const filtered = initialPortals.filter(portal => {
    const matchesSearch =
      !search ||
      portal.name?.toLowerCase().includes(search.toLowerCase()) ||
      portal.portal_id?.toLowerCase().includes(search.toLowerCase()) ||
      portal.location?.toLowerCase().includes(search.toLowerCase())

    const live = statuses[portal.id]
    const currentStatus = live?.status ?? portal.status ?? 'offline'
    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const counts = {
    all:     initialPortals.length,
    online:  initialPortals.filter(p => (statuses[p.id]?.status ?? p.status) === 'online').length,
    offline: initialPortals.filter(p => (statuses[p.id]?.status ?? p.status) === 'offline').length,
    alert:   initialPortals.filter(p => (statuses[p.id]?.status ?? p.status) === 'alert').length,
  }

  const filterBtns: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all',     label: `Todos (${counts.all})`,             color: 'text-gray-400 border-gray-600'   },
    { key: 'online',  label: `En linea (${counts.online})`,       color: 'text-teal-400 border-teal-600'   },
    { key: 'offline', label: `Fuera de linea (${counts.offline})`, color: 'text-red-400 border-red-600'     },
    { key: 'alert',   label: `Alerta (${counts.alert})`,          color: 'text-yellow-400 border-yellow-600' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar portal por nombre, ID o ubicacion..."
            className="w-full bg-[#0F0F1A] border border-[#1A1A2E] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5] transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                statusFilter === btn.key
                  ? `${btn.color} bg-white/5`
                  : 'text-gray-500 border-[#1A1A2E] hover:border-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">No se encontraron portales con los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(portal => (
            <PortalCard
              key={portal.id}
              portal={portal}
              liveStatus={statuses[portal.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
