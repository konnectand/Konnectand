import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'
import type { AuthUser, RoleName } from './types'

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('*, roles(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles) return null

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: profile.full_name ?? user.email ?? 'Usuario',
    role: profile.roles.name as RoleName,
    role_level: profile.roles.level ?? 0,
    client_id: profile.client_id ?? null,
    permissions: profile.roles.permissions ?? {},
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
    return null as never
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('*, roles(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles) {
    redirect('/api/auth/signout')
    return null as never
  }

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: profile.full_name ?? user.email ?? 'Usuario',
    role: profile.roles.name as RoleName,
    role_level: profile.roles.level ?? 0,
    client_id: profile.client_id ?? null,
    permissions: profile.roles.permissions ?? {},
  }
}

export function isKonnectANDStaff(role: RoleName): boolean {
  return ['super_admin', 'admin_konnectand', 'operator_konnectand'].includes(role)
}

export function canManageClients(role: RoleName): boolean {
  return ['super_admin', 'admin_konnectand'].includes(role)
}

export function canManageUsers(role: RoleName): boolean {
  return ['super_admin', 'admin_konnectand', 'admin_client'].includes(role)
}

export function canSendCommands(role: RoleName): boolean {
  return ['super_admin', 'admin_konnectand', 'operator_konnectand', 'operator_client'].includes(role)
}

export function canManagePairings(role: RoleName): boolean {
  return ['super_admin', 'admin_konnectand', 'admin_client'].includes(role)
}
