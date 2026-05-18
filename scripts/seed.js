// @ts-check
'use strict'

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL              = 'https://bccmlqmrzvofeljofdjy.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY21scW1yenZvZmVsam9mZGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAzMDc3MiwiZXhwIjoyMDk0NjA2NzcyfQ.3TyrzgKpwMM5cJMDDSDgcs5_4Dr5ELDl8QvIL5QnFPE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function fail(label, error) {
  console.error(`\nx  ${label}`)
  console.error(`   code: ${error.code ?? '-'}`)
  console.error(`   msg:  ${error.message}`)
  throw error
}

async function seed() {
  console.log('=======================================')
  console.log('  KonnectAND -- database seed')
  console.log('  Target:', SUPABASE_URL)
  console.log('=======================================')

  const ROLES = [
    { name: 'super_admin',         level: 1, permissions: { all: true } },
    { name: 'admin_konnectand',    level: 2, permissions: { portals: true, clients: true, connections: true, updates: true, analytics: true } },
    { name: 'admin_client',        level: 3, permissions: { own_portals: true, content: true, pairings: true, analytics: true } },
    { name: 'operator_konnectand', level: 4, permissions: { monitor: true, intervene: true, analytics: true } },
    { name: 'operator_client',     level: 5, permissions: { own_portals: true, content: true, analytics: true } },
    { name: 'viewer_client',       level: 6, permissions: { analytics: true } },
  ]

  console.log('\n[1/2] Inserting roles...')
  const insertedRoles = []
  for (const role of ROLES) {
    const { data, error } = await supabase
      .from('roles')
      .upsert(role, { onConflict: 'name', ignoreDuplicates: false })
      .select()
      .single()

    if (error) fail(`roles -> ${role.name}`, error)
    insertedRoles.push(data)
    console.log(`   ok  ${data.name} (level ${data.level})  id=${data.id}`)
  }

  console.log('\n[2/2] Inserting user...')
  const superAdminRole = insertedRoles.find(r => r.name === 'super_admin')
  if (!superAdminRole) throw new Error('super_admin role not found after insert')

  const USER = {
    id:        'd5a3a563-6aba-48c9-84bc-96c8ebfedbb1',
    email:     'konnectand@gmail.com',
    full_name: 'Admin KonnectAND',
    role_id:   superAdminRole.id,
    client_id: null,
    active:    true,
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', USER.email)
    .neq('id', USER.id)
    .maybeSingle()

  if (existing) {
    console.log(`   ! found existing user with same email but id=${existing.id} -- removing...`)
    const { error: delError } = await supabase.from('users').delete().eq('id', existing.id)
    if (delError) fail(`delete stale user ${existing.id}`, delError)
    console.log('   ok stale row deleted')
  }

  const { data: insertedUser, error: userError } = await supabase
    .from('users')
    .upsert(USER, { onConflict: 'id', ignoreDuplicates: false })
    .select('id, email, full_name, active, role_id')
    .single()

  if (userError) fail('users -> konnectand@gmail.com', userError)
  console.log(`   ok  ${insertedUser.email}  id=${insertedUser.id}`)

  console.log('\n=======================================')
  console.log(`  Roles : ${insertedRoles.length} / ${ROLES.length}`)
  console.log('  Users : 1 / 1')
  console.log('  Seed complete')
  console.log('=======================================\n')
}

seed().catch(err => {
  console.error('\nSeed aborted --', err.message ?? err)
  process.exit(1)
})
