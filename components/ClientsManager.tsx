'use client'

import { useState } from 'react'
import { actionInsertClient, actionToggleClient } from '@/lib/actions'
import { Building2, Globe, Mail, Plus, X, Loader2, Monitor } from 'lucide-react'
import type { Client } from '@/lib/types'

interface Props {
  initialClients: Client[]
  portalCounts: Record<string, number>
}

const EMPTY_FORM = { name: '', contact_name: '', contact_email: '', country: '', active: true }

export function ClientsManager({ initialClients, portalCounts }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    const { data, error: err } = await actionInsertClient(form)
    if (err) {
      setError(err)
    } else if (data) {
      setClients(prev => [data, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setTogglingId(id)
    await actionToggleClient(id, !currentActive)
    setClients(prev => prev.map(c => c.id === id ? { ...c, active: !currentActive } : c))
    setTogglingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] text-white text-sm font-medium transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nuevo cliente'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0F0F1A] border border-[#8B7FF5]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear cliente</h3>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name',          label: 'Nombre empresa',  placeholder: 'Empresa S.L.'    },
              { key: 'contact_name',  label: 'Contacto',        placeholder: 'Juan Garcia'     },
              { key: 'contact_email', label: 'Email contacto',  placeholder: 'juan@empresa.com' },
              { key: 'country',       label: 'Pais',            placeholder: 'Espana'          },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                <input
                  type={field.key === 'contact_email' ? 'email' : 'text'}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5]"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cliente
          </button>
        </div>
      )}

      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A1A2E] text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Contacto</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Pais</th>
              <th className="text-center px-4 py-3 font-medium">Portales</th>
              <th className="text-center px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A2E]">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500 text-sm">Sin clientes registrados</td>
              </tr>
            ) : clients.map(client => (
              <tr key={client.id} className={`hover:bg-white/2 transition-colors ${!client.active ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#8B7FF5]/15 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-[#8B7FF5]" />
                    </div>
                    <span className="text-white font-medium">{client.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="text-gray-300">{client.contact_name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {client.contact_email}
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Globe className="w-3.5 h-3.5" />
                    {client.country || '—'}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-300">
                    <Monitor className="w-3.5 h-3.5 text-gray-500" />
                    {portalCounts[client.id] ?? 0}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${client.active ? 'bg-teal-500/15 text-teal-400 border-teal-500/25' : 'bg-gray-500/15 text-gray-500 border-gray-500/25'}`}>
                    {client.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => handleToggleActive(client.id, client.active)}
                    disabled={togglingId === client.id}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {togglingId === client.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : client.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
