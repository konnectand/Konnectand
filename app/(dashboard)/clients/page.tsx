import { requireAuth, canManageClients } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientsManager } from '@/components/ClientsManager'
import { Building2 } from 'lucide-react'

export default async function ClientsPage() {
  const user = await requireAuth()

  if (!canManageClients(user.role)) {
    redirect('/dashboard')
  }

  const supabase = createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const { data: portalCounts } = await supabase
    .from('portals')
    .select('client_id')

  const countMap: Record<string, number> = {}
  portalCounts?.forEach(p => {
    countMap[p.client_id] = (countMap[p.client_id] ?? 0) + 1
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#8B7FF5]" />
          Clientes
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {clients?.length ?? 0} clientes registrados
        </p>
      </div>

      <ClientsManager
        initialClients={clients ?? []}
        portalCounts={countMap}
      />
    </div>
  )
}
