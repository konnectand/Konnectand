'use client'

import { useCallback, useRef, useState } from 'react'
import IdleScreen     from './IdleScreen'
import PresenceScreen from './PresenceScreen'
import ActiveScreen   from './ActiveScreen'
import StandbyScreen  from './StandbyScreen'
import { useHeartbeat }       from '@/hooks/useHeartbeat'
import { useCommandListener } from '@/hooks/useCommandListener'
import { useWebRTC }          from '@/hooks/useWebRTC'
import type { KioskState, PortalCommand } from '@/lib/types'

interface Props { portalId: string }

export default function KioskApp({ portalId }: Props) {
  const [state, setState] = useState<KioskState>('IDLE')
  const stateRef = useRef<KioskState>('IDLE')

  const set = useCallback((s: KioskState) => {
    stateRef.current = s
    setState(s)
  }, [])

  const { localStream, remoteStream, startCall, hangUp } = useWebRTC(portalId)

  const handleCommand = useCallback((cmd: PortalCommand) => {
    switch (cmd.type) {
      case 'set_standby':   set('STANDBY'); break
      case 'resume':        set('IDLE');    break
      case 'initiate_call': startCall(cmd.peerId).then(() => set('ACTIVE')); break
      case 'end_call':      hangUp(); set('IDLE'); break
    }
  }, [set, startCall, hangUp])

  useHeartbeat(portalId, stateRef)
  useCommandListener(portalId, handleCommand)

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#09090F] cursor-none select-none">
      {state === 'IDLE' && (
        <IdleScreen
          portalId={portalId}
          onMotionDetected={() => set('PRESENCE')}
        />
      )}
      {state === 'PRESENCE' && (
        <PresenceScreen
          portalId={portalId}
          onExpired={() => set('IDLE')}
          onActivated={() => set('ACTIVE')}
        />
      )}
      {state === 'ACTIVE' && (
        <ActiveScreen
          localStream={localStream}
          remoteStream={remoteStream}
          onHangUp={() => { hangUp(); set('IDLE') }}
        />
      )}
      {state === 'STANDBY' && <StandbyScreen portalId={portalId} />}
    </div>
  )
}
