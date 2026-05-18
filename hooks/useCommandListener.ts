import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PortalCommand } from '@/lib/types'

export function useCommandListener(
  portalId: string,
  onCommand: (cmd: PortalCommand) => void,
) {
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      const { data } = await supabase
        .from('portals')
        .select('id')
        .eq('portal_id', portalId)
        .maybeSingle()

      if (!data) return

      channel = supabase
        .channel(`commands:${portalId}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'portal_logs',
            filter: `portal_id=eq.${data.id}`,
          },
          (payload) => {
            const row = payload.new as { level: string; message: string }
            if (row.level !== 'command') return
            try {
              const cmd = JSON.parse(row.message) as PortalCommand
              onCommandRef.current(cmd)
            } catch {
              console.error('[CommandListener] Bad command payload:', row.message)
            }
          },
        )
        .subscribe()
    }

    setup()
    return () => { channel?.unsubscribe() }
  }, [portalId])
}
