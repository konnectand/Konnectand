'use client'

import { useState } from 'react'
import { actionInsertUser, actionToggleUser } from '@/lib/actions'
import { Mail, Plus, X, Loader2 } from 'lucide-react'
import type { RoleName } from '@/lib/types'

const ROLE_COLORS: Record<string, string> = {
  super_admin:         'bg-[#8B7FF5]/15 text-[#8B7FF5] border-[#8B7FF5]/25',
  admin_konnectand:    'bg-[#8B7FF5]/10 text-purple-300 border-purple-500/20',
  admin_client:        'bg-[#2DD4A8]/15 text-teal-400 border-teal-500/25',
  operator_konnectand: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  operator_client:     'bg-[#F0B429]/15 text-yellow-400 border-yellow-500/25',
  viewer_client:       'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:         'Super Admin',
  admin_konnectand:    'Admin KonnectAND',
  admin_client:        'Admin Cliente',
  operator_konnectand: 'Operador KonnectAND',
  operator_client:     'Operador Cliente',
  viewer_client:       'Visor Cliente',
}

interface Props {
  initialUsers: any[]
  roles: any[]
  clients: any[]
  currentUserRole: RoleName
  currentClientId: string | null
}

const EMPTY_FORM = { email: '', full_name: '', role_id: '', client_id: '', active: true }

export function UsersManager({ initialUsers, roles, clients, currentUserRole, currentClientId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const isStaff = ['super_admin', 'admin_konnectand'].includes(currentUserRole)

  async function handleCreate() {
    setSaving(true)
    setError(null)

    const payload = {
      email:     form.email,
      full_name: form.full_name,
      role_id:   form.role_id || roles[0]?.id,
      active:    true,
      client_id: form.client_id || currentClientId || null,
    }

    const { data, error: err } = await actionInsertUser(payload)
    if (err) {
      setError(err)
    } else if (data) {
      setUsers(prev => [data, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setTogglingId(id)
    await actionToggleUser(id, !currentActive)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !currentActive } : u))
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
          {showForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0F0F1A] border border-[#8B7FF5]/30 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Crear usuario</h3>
          <p className="text-xs text-gray-500">El usuario debera ser creado tambien en Supabase Auth para poder iniciar sesion.</p>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="usuario@empresa.com"
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Ana Garcia"
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8B7FF5]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Rol</label>
              <select
                value={form.role_id}
                onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}
                className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] ?? r.name}</option>
                ))}
              </select>
            </div>
            {isStaff && clients.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Cliente (opcional)</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  className="w-full bg-[#09090F] border border-[#1A1A2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8B7FF5]"
                >
                  <option value="">Sin cliente (KonnectAND)</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !form.email || !form.full_name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B7FF5] hover:bg-[#7B6FE5] disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear usuario
          </button>
        </div>
      )}

      <div className="bg-[#0F0F1A] border border-[#1A1A2E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A1A2E] text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Usuario</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Rol</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cliente</th>
              <th className="text-center px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A2E]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-sm">Sin usuarios registrados</td>
              </tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className={`hover:bg-white/2 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#8B7FF5]/15 flex items-center justify-center shrink-0">
                      <span className="text-xs text-[#8B7FF5] font-semibold">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  {u.roles && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.roles.name] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/25'}`}>
                      {ROLE_LABELS[u.roles.name] ?? u.roles.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 hidden lg:table-cell text-gray-400 text-sm">
                  {u.clients?.name ?? <span className="text-gray-600 text-xs">KonnectAND</span>}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${u.active ? 'bg-teal-500/15 text-teal-400 border-teal-500/25' : 'bg-gray-500/15 text-gray-500 border-gray-500/25'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => handleToggleActive(u.id, u.active)}
                    disabled={togglingId === u.id}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {togglingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : u.active ? 'Desactivar' : 'Activar'}
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
