'use client'

import { useState } from 'react'
import { actionInsertPairing, actionTogglePairing } from '@/lib/actions'
import { StatusBadge } from './StatusBadge'
import { Link2, Plus, Power, Loader2, X } from 'lucide-react'
import Link from 'next/link'

interface PortalInfo {
  id: string
  name: string
  portal_id: string
  status: string
}

interface Pairing {
  id: string
  portal_a: string
  portal_b: string
  app_mode: string
  active: boolean
  created_at: string
  portal_a_info?: PortalInfo
  portal_b_info?: PortalInfo
}

interface Props {
  initialPairings: Pairing[]
  availablePortals: any[]
  canManage: boolean
}

export function PairingsManager({ initialPairings, availablePortals, canManage }: Props) {
  const [pairings, setPairings] = useState(initialPairings)
  const [showForm, setShowForm] = useState(false)
  const [formPortalA, setFormPortalA] = useState('')
  const [formPortalB, setFormPortalB] = useState('')
  const [formMode, setFormMode] = useState('conference')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleCreate() {
    if (!formPortalA || !formPortalB || formPortalA === formPortalB) return
    setSaving(true)
    const { data, error } = await actionInsertPairing({ portal_a: formPortalA, portal_b: formPortalB, app_mode: formMode })
    if (!error && data) {
      setPairings(prev => [data, ...prev])
      setShowForm(false)
      setFormPortalA('')
      setFormPortalB('')
    }
    setSaving(false)
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setToggling(id)
    const { error } = await actionTogglePairing(id, !currentActive)
    if (!error) {
      setPairings(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p))
    }
    setToggling(null)
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] text-white text-sm font-medium transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Nuevo emparejamiento'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-[#0F0F1A] border border-[#8B7FF5]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Nuevo emparejamiento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Portal A</label>
              <select
                value={formPortalA}
                onChange={e => setFormPortalA(e.target.value)}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                <option value="">Seleccionar portal...</option>
                {availablePortals.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Portal B</label>
              <select
                value={formPortalB}
                onChange={e => setFormPortalB(e.target.value)}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                <option value="">Seleccionar portal...</option>
                {availablePortals.filter((p: any) => p.id !== formPortalA).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Modo</label>
              <select
                value={formMode}
                onChange={e => setFormMode(e.target.value)}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                {['conference', 'kiosk', 'demo', 'default'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !formPortalA || !formPortalB}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear emparejamiento
          </button>
        </div>
      )}

      {pairings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Link2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay emparejamientos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairings.map(pair => (
            <div
              key={pair.id}
              className={`bg-[#0F0F1A] border rounded-xl p-5 transition-all ${pair.active ? 'border-[#1A1A2E]' : 'border-[#1A1A2E] opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <Link href={`/portals/${pair.portal_a}`} className="flex-1 min-w-0 group">
                  <p className="text-sm font-medium text-white group-hover:text-[#8B7FF5] transition-colors truncate">
                    {pair.portal_a_info?.name ?? pair.portal_a}
                  </p>
                  <StatusBadge status={pair.portal_a_info?.status ?? 'unknown'} size="sm" />
                </Link>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Link2 className={`w-5 h-5 ${pair.active ? 'text-[#8B7FF5]' : 'text-gray-600'}`} />
                  <span className="text-[10px] font-mono text-gray-600">{pair.app_mode}</span>
                </div>

                <Link href={`/portals/${pair.portal_b}`} className="flex-1 min-w-0 text-right group">
                  <p className="text-sm font-medium text-white group-hover:text-[#8B7FF5] transition-colors truncate">
                    {pair.portal_b_info?.name ?? pair.portal_b}
                  </p>
                  <div className="flex justify-end">
                    <StatusBadge status={pair.portal_b_info?.status ?? 'unknown'} size="sm" />
                  </div>
                </Link>

                {canManage && (
                  <button
                    onClick={() => handleToggle(pair.id, pair.active)}
                    disabled={toggling === pair.id}
                    className={`p-2 rounded-lg transition-colors ${pair.active ? 'text-teal-400 hover:bg-teal-500/10' : 'text-gray-600 hover:bg-gray-500/10'}`}
                  >
                    {toggling === pair.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
