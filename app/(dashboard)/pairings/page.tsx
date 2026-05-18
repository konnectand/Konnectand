import { requireAuth, isKonnectANDStaff, canManagePairings } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PairingsManager } from '@/components/PairingsManager'
import { Link2 } from 'lucide-react'

export default async function PairingsPage() {
  const user = await requireAuth()
  const db = createAdminClient()

  let portalsQuery = db
    .from('portals')
    .select('id, name, portal_id, status, client_id, clients(name)')
    .order('name')

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    portalsQuery = portalsQuery.eq('client_id', user.client_id)
  }

  const [{ data: rawPairings, error: pairingsError }, { data: portals }] = await Promise.all([
    db
      .from('pairings')
      .select(`
        *,
        portal_a_info:portals!portal_a(id, name, portal_id, status),
        portal_b_info:portals!portal_b(id, name, portal_id, status)
      `)
      .order('created_at', { ascending: false }),
    portalsQuery,
  ])

  // If the join fails (e.g. ambiguous FK hint on this Supabase version), fall back to
  // a plain select + manual lookup so the page always renders real data.
  let resolvedPairings = rawPairings ?? []

  if (pairingsError || resolvedPairings.length === 0) {
    const { data: plainPairings } = await db
      .from('pairings')
      .select('*')
      .order('created_at', { ascending: false })

    if (plainPairings && plainPairings.length > 0) {
      const allPortalIds = [
        ...plainPairings.map(p => p.portal_a),
        ...plainPairings.map(p => p.portal_b),
      ].filter(Boolean)

      const { data: portalRows } = await db
        .from('portals')
        .select('id, name, portal_id, status')
        .in('id', Array.from(new Set(allPortalIds)))

      const portalMap = Object.fromEntries((portalRows ?? []).map(p => [p.id, p]))

      resolvedPairings = plainPairings.map(p => ({
        ...p,
        portal_a_info: portalMap[p.portal_a] ?? null,
        portal_b_info: portalMap[p.portal_b] ?? null,
      }))
    }
  }

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
        initialPairings={resolvedPairings}
        availablePortals={portals ?? []}
        canManage={canManage}
      />
    </div>
  )
}
