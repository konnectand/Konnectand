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

  // Camera stream managed here so it persists across PRESENCE → ACTIVE without re-requesting permission
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const openCamera = useCallback(async () => {
    if (cameraStreamRef.current) return
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch (err) {
      console.error('[KioskApp] Camera open failed:', err)
    }
  }, [])

  const closeCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop())
    cameraStreamRef.current = null
  }, [])

  const handleCommand = useCallback((cmd: PortalCommand) => {
    switch (cmd.type) {
      case 'set_standby':
        closeCamera()
        set('STANDBY')
        break
      case 'resume':
        set('IDLE')
        break
      case 'initiate_call':
        openCamera().then(() => {
          startCall(cmd.peerId, cameraStreamRef.current ?? undefined).then(() => set('ACTIVE'))
        })
        break
      case 'end_call':
        hangUp()
        closeCamera()
        set('IDLE')
        break
    }
  }, [set, startCall, hangUp, openCamera, closeCamera])

  useHeartbeat(portalId, stateRef)
  useCommandListener(portalId, handleCommand)

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#09090F] cursor-none select-none">
      {state === 'IDLE' && (
        <IdleScreen
          portalId={portalId}
          onMotionDetected={() => {
            set('PRESENCE')
            openCamera()  // pre-warm camera while user decides to connect
          }}
        />
      )}
      {state === 'PRESENCE' && (
        <PresenceScreen
          portalId={portalId}
          onExpired={() => { closeCamera(); set('IDLE') }}
          onActivated={() => set('ACTIVE')}
        />
      )}
      {state === 'ACTIVE' && (
        <ActiveScreen
          localStream={localStream}
          remoteStream={remoteStream}
          onHangUp={() => { hangUp(); closeCamera(); set('IDLE') }}
        />
      )}
      {state === 'STANDBY' && <StandbyScreen portalId={portalId} />}
    </div>
  )
}
