import { requireAuth, canManageUsers, isKonnectANDStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersManager } from '@/components/UsersManager'
import { Users } from 'lucide-react'

export default async function UsersPage() {
  const user = await requireAuth()

  if (!canManageUsers(user.role)) {
    redirect('/dashboard')
  }

  const supabase = createClient()

  let usersQuery = supabase
    .from('users')
    .select('*, roles(id, name, level), clients(id, name)')
    .order('created_at', { ascending: false })

  if (!isKonnectANDStaff(user.role) && user.client_id) {
    usersQuery = usersQuery.eq('client_id', user.client_id)
  }

  const [{ data: users }, { data: roles }, { data: clients }] = await Promise.all([
    usersQuery,
    supabase.from('roles').select('*').order('level'),
    isKonnectANDStaff(user.role)
      ? supabase.from('clients').select('id, name').eq('active', true)
      : { data: null },
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#8B7FF5]" />
          Usuarios
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {users?.length ?? 0} usuarios registrados
        </p>
      </div>

      <UsersManager
        initialUsers={users ?? []}
        roles={roles ?? []}
        clients={clients ?? []}
        currentUserRole={user.role}
        currentClientId={user.client_id}
      />
    </div>
  )
}
