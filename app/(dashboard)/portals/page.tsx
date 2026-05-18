import { requireAuth, isKonnectANDStaff, canManageClients } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { RealtimePortalsList } from '@/components/RealtimePortalsList'
import { Monitor } from 'lucide-react'

export default async function PortalsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  let query = supabase
    .from('portals')
    .select('*, clients(name, country), portal_status(*)')
    .order('name')

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    query = query.eq('client_id', user.client_id)
  }

  const [{ data: portals, error }, { data: clients }] = await Promise.all([
    query,
    supabase.from('clients').select('id, name').eq('active', true).order('name'),
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#8B7FF5]" />
            Portales
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {portals?.length ?? 0} dispositivos registrados
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          Error al cargar portales: {error.message}
        </div>
      )}

      <RealtimePortalsList
        initialPortals={portals ?? []}
        clients={clients ?? []}
        canCreate={canManageClients(user.role)}
      />
    </div>
  )
}
