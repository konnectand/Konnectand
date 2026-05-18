'use server'

import { createAdminClient } from './supabase/admin'

// ── CLIENTS ─────────────────────────────────────────────

export async function actionInsertClient(payload: {
  name: string
  contact_name: string
  contact_email: string
  country: string
  active: boolean
}) {
  const db = createAdminClient()
  const { data, error } = await db.from('clients').insert(payload).select().single()
  return { data, error: error ? error.message : null }
}

export async function actionToggleClient(id: string, active: boolean) {
  const db = createAdminClient()
  const { error } = await db.from('clients').update({ active }).eq('id', id)
  return { error: error ? error.message : null }
}

// ── PORTALS ──────────────────────────────────────────────

export async function actionInsertPortal(payload: {
  portal_id: string
  name: string
  client_id: string
  location: string
  country: string
  app_mode: string
}) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('portals')
    .insert({ ...payload, status: 'offline', hardware_info: {} })
    .select('*, clients(name, country), portal_status(*)')
    .single()
  return { data, error: error ? error.message : null }
}

// ── PAIRINGS ─────────────────────────────────────────────

export async function actionInsertPairing(payload: {
  portal_a: string
  portal_b: string
  app_mode: string
}) {
  const db = createAdminClient()
  const { data: inserted, error } = await db
    .from('pairings')
    .insert({ ...payload, active: true, schedule: {} })
    .select('id')
    .single()

  if (error || !inserted) return { data: null, error: error ? error.message : 'Unknown error' }

  // Fetch with joins separately (admin client bypasses RLS on portals too)
  const { data, error: fetchErr } = await db
    .from('pairings')
    .select('*, portal_a_info:portals!portal_a(id, name, portal_id, status), portal_b_info:portals!portal_b(id, name, portal_id, status)')
    .eq('id', inserted.id)
    .single()

  return { data, error: fetchErr ? fetchErr.message : null }
}

export async function actionTogglePairing(id: string, active: boolean) {
  const db = createAdminClient()
  const { error } = await db.from('pairings').update({ active }).eq('id', id)
  return { error: error ? error.message : null }
}

// ── USERS ─────────────────────────────────────────────────

export async function actionInsertUser(payload: {
  email: string
  full_name: string
  role_id: string
  client_id?: string | null
  active: boolean
}) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('users')
    .insert(payload)
    .select('*, roles(*), clients(*)')
    .single()
  return { data, error: error ? error.message : null }
}

export async function actionToggleUser(id: string, active: boolean) {
  const db = createAdminClient()
  const { error } = await db.from('users').update({ active }).eq('id', id)
  return { error: error ? error.message : null }
}

// ── PORTAL COMMANDS ───────────────────────────────────────

export async function actionInsertPortalLog(payload: {
  portal_id: string
  level: string
  message: string
  data?: Record<string, unknown>
}) {
  const db = createAdminClient()
  const { error } = await db.from('portal_logs').insert(payload)
  return { error: error ? error.message : null }
}

export async function actionUpdatePortalMode(portalId: string, mode: string) {
  const db = createAdminClient()
  const { error } = await db.from('portals').update({ app_mode: mode }).eq('id', portalId)
  return { error: error ? error.message : null }
}
