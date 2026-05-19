import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { actionUpsertPortalStatus } from '@/lib/actions'
import { HEARTBEAT_INTERVAL_MS } from '@/lib/constants'
import type { KioskState } from '@/lib/types'

export function useHeartbeat(portalId: string, stateRef: React.MutableRefObject<KioskState>) {
  const dbIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function beat(status?: 'online' | 'offline') {
      if (!dbIdRef.current) return
      const mem = (performance as any).memory
      await actionUpsertPortalStatus(dbIdRef.current, {
        status:       status ?? (stateRef.current === 'STANDBY' ? 'offline' : 'online'),
        last_seen:    new Date().toISOString(),
        cpu_usage:    0,
        memory_usage: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0,
      })
    }

    async function init() {
      const supabase = createClient()
      const { data } = await supabase
        .from('portals')
        .select('id')
        .eq('portal_id', portalId)
        .maybeSingle()

      if (!data) {
        console.warn(`[Heartbeat] Portal "${portalId}" not found in DB — heartbeat disabled`)
        return
      }

      dbIdRef.current = data.id
      await beat('online')
    }

    init()
    const interval = setInterval(() => beat(), HEARTBEAT_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      beat('offline')
    }
  }, [portalId])
}
