import { requireAuth, isKonnectANDStaff, canManagePairings } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { PairingsManager } from '@/components/PairingsManager'
import { Link2 } from 'lucide-react'

export default async function PairingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  let portalsQuery = supabase
    .from('portals')
    .select('id, name, portal_id, status, client_id, clients(name)')
    .order('name')

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    portalsQuery = portalsQuery.eq('client_id', user.client_id)
  }

  const [{ data: pairings }, { data: portals }] = await Promise.all([
    supabase
      .from('pairings')
      .select('*, portal_a_info:portals!portal_a(id, name, portal_id, status), portal_b_info:portals!portal_b(id, name, portal_id, status)')
      .order('created_at', { ascending: false }),
    portalsQuery,
  ])

  const canManage = canManagePairings(user.role)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#8B7FF5]" />
            Emparejamientos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pares de portales en videoconferencia
          </p>
        </div>
      </div>

      <PairingsManager
        initialPairings={pairings ?? []}
        availablePortals={portals ?? []}
        canManage={canManage}
      />
    </div>
  )
}
