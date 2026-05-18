'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { actionInsertPortal } from '@/lib/actions'
import { PortalCard } from './PortalCard'
import { Search, Plus, X, Loader2 } from 'lucide-react'
import type { Portal, PortalStatus } from '@/lib/types'

interface ClientOption { id: string; name: string }

interface Props {
  initialPortals: Portal[]
  clients: ClientOption[]
  canCreate: boolean
}

const APP_MODES = ['videoconference', 'games', 'ar_frames', 'ai_assistant']

const EMPTY_FORM = {
  portal_id: '',
  name:      '',
  client_id: '',
  location:  '',
  country:   '',
  app_mode:  'videoconference',
}

type StatusFilter = 'all' | 'online' | 'offline' | 'alert'

export function RealtimePortalsList({ initialPortals, clients, canCreate }: Props) {
  const [portals, setPortals] = useState<Portal[]>(initialPortals)
  const [statuses, setStatuses] = useState<Record<string, PortalStatus>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleCreate() {
    if (!form.portal_id || !form.name) return
    setSaving(true)
    setFormError(null)
    const { data, error } = await actionInsertPortal(form)
    if (error) {
      setFormError(error)
    } else if (data) {
      setPortals(prev => [data, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  useEffect(() => {
    const supabase = createClient()
    const portalIds = portals.map(p => p.id)

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
  }, [portals])

  const filtered = portals.filter(portal => {
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
    all:     portals.length,
    online:  portals.filter(p => (statuses[p.id]?.status ?? p.status) === 'online').length,
    offline: portals.filter(p => (statuses[p.id]?.status ?? p.status) === 'offline').length,
    alert:   portals.filter(p => (statuses[p.id]?.status ?? p.status) === 'alert').length,
  }

  const filterBtns: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all',     label: `Todos (${counts.all})`,             color: 'text-gray-400 border-gray-600'   },
    { key: 'online',  label: `En linea (${counts.online})`,       color: 'text-teal-400 border-teal-600'   },
    { key: 'offline', label: `Fuera de linea (${counts.offline})`, color: 'text-red-400 border-red-600'     },
    { key: 'alert',   label: `Alerta (${counts.alert})`,          color: 'text-yellow-400 border-yellow-600' },
  ]

  return (
    <div className="space-y-4">

      {/* ── Create button ── */}
      {canCreate && (
        <div className="flex justify-end">
          <button
            onClick={() => { setShowForm(!showForm); setFormError(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] text-white text-sm font-medium transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Nuevo portal'}
          </button>
        </div>
      )}

      {/* ── Create form ── */}
      {showForm && (
        <div className="bg-[#0F0F1A] border border-[#8B7FF5]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear portal</h3>
          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: 'portal_id', label: 'Portal ID',   placeholder: 'AND-001' },
              { key: 'name',      label: 'Nombre',      placeholder: 'Portal Andorra Centro' },
              { key: 'location',  label: 'Ubicación',   placeholder: 'Carrer Major, 12' },
              { key: 'country',   label: 'País',        placeholder: 'Andorra' },
            ] as const).map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cliente</label>
              <select
                value={form.client_id}
                onChange={e => setForm(prev => ({ ...prev, client_id: e.target.value }))}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                <option value="">Sin cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Modo de app</label>
              <select
                value={form.app_mode}
                onChange={e => setForm(prev => ({ ...prev, app_mode: e.target.value }))}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                {APP_MODES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !form.portal_id || !form.name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear portal
          </button>
        </div>
      )}

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
