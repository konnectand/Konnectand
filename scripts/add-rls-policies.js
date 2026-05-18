#!/usr/bin/env node
// Applies RLS policies via Supabase Management API.
// Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
// Usage:
//   $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node scripts/add-rls-policies.js

'use strict'

const PROJECT_REF = 'bccmlqmrzvofeljofdjy'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const TABLES = ['clients', 'portals', 'pairings', 'portal_status', 'portal_logs', 'analytics']

// Role check: the calling user's role_id must map to super_admin or admin_konnectand
const IS_ADMIN = `(
  SELECT r.name FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = auth.uid()
) IN ('super_admin', 'admin_konnectand')`

function buildSQL() {
  const lines = ['-- KonnectAND RLS policies', '']

  for (const t of TABLES) {
    lines.push(`-- ── ${t} ──────────────────────────`)
    lines.push(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`)
    lines.push('')

    // SELECT: any authenticated user
    lines.push(`DROP POLICY IF EXISTS "${t}_select_authenticated" ON public.${t};`)
    lines.push(
      `CREATE POLICY "${t}_select_authenticated" ON public.${t}` +
      ` FOR SELECT TO authenticated USING (true);`
    )
    lines.push('')

    // INSERT: admins only
    lines.push(`DROP POLICY IF EXISTS "${t}_insert_admin" ON public.${t};`)
    lines.push(
      `CREATE POLICY "${t}_insert_admin" ON public.${t}` +
      ` FOR INSERT TO authenticated WITH CHECK (${IS_ADMIN});`
    )
    lines.push('')

    // UPDATE: admins only
    lines.push(`DROP POLICY IF EXISTS "${t}_update_admin" ON public.${t};`)
    lines.push(
      `CREATE POLICY "${t}_update_admin" ON public.${t}` +
      ` FOR UPDATE TO authenticated USING (${IS_ADMIN}) WITH CHECK (${IS_ADMIN});`
    )
    lines.push('')

    // DELETE: admins only
    lines.push(`DROP POLICY IF EXISTS "${t}_delete_admin" ON public.${t};`)
    lines.push(
      `CREATE POLICY "${t}_delete_admin" ON public.${t}` +
      ` FOR DELETE TO authenticated USING (${IS_ADMIN});`
    )
    lines.push('')
  }

  return lines.join('\n')
}

async function applyViaManagementAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Management API ${res.status}: ${body}`)
  }
  return res.json()
}

async function main() {
  const sql = buildSQL()

  if (!ACCESS_TOKEN) {
    console.log('=======================================================')
    console.log('  SUPABASE_ACCESS_TOKEN not set.')
    console.log('  Get one at: https://supabase.com/dashboard/account/tokens')
    console.log('  Then run:')
    console.log('  $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node scripts/add-rls-policies.js')
    console.log('=======================================================')
    console.log('\nAlternatively, paste the SQL below into the Supabase SQL editor:')
    console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new\n`)
    console.log('─'.repeat(55))
    console.log(sql)
    console.log('─'.repeat(55))
    return
  }

  console.log(`Applying RLS policies to project ${PROJECT_REF}...`)

  // Split into per-table blocks so errors are isolated
  for (const t of TABLES) {
    const tableSQL = sql
      .split('\n')
      .filter(line => {
        if (line.startsWith('-- KonnectAND')) return false
        if (line.startsWith(`-- ── ${t}`)) return true
        if (line.includes(`.${t}`) || line === '' || line.startsWith(`ALTER TABLE public.${t}`)) return true
        return false
      })
      .join('\n')

    // Re-extract per-table cleanly
    const start = sql.indexOf(`-- ── ${t}`)
    const next  = TABLES[TABLES.indexOf(t) + 1]
    const end   = next ? sql.indexOf(`-- ── ${next}`) : sql.length
    const chunk = sql.slice(start, end).trim()

    try {
      await applyViaManagementAPI(chunk)
      console.log(`  ✓  ${t}`)
    } catch (err) {
      console.error(`  ✗  ${t}: ${err.message}`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
