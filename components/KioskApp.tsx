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
    console.log(`[KioskApp:${portalId}] state: ${stateRef.current} → ${s}`)
    stateRef.current = s
    setState(s)
  }, [portalId])

  const { localStream, remoteStream, startCall, hangUp } = useWebRTC(portalId)

  // Camera stream managed here so it persists across PRESENCE → ACTIVE without re-requesting permission
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const openCamera = useCallback(async () => {
    if (cameraStreamRef.current) {
      console.log(`[KioskApp:${portalId}] openCamera — already open, reusing`)
      return
    }
    console.log(`[KioskApp:${portalId}] openCamera — calling getUserMedia...`)
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const tracks = cameraStreamRef.current.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', ')
      console.log(`[KioskApp:${portalId}] openCamera OK — tracks: ${tracks}`)
    } catch (err) {
      console.error(`[KioskApp:${portalId}] openCamera failed:`, err)
    }
  }, [portalId])

  const closeCamera = useCallback(() => {
    if (!cameraStreamRef.current) return
    console.log(`[KioskApp:${portalId}] closeCamera — stopping tracks`)
    cameraStreamRef.current.getTracks().forEach(t => t.stop())
    cameraStreamRef.current = null
  }, [portalId])

  const handleCommand = useCallback((cmd: PortalCommand) => {
    console.log(`[KioskApp:${portalId}] command received:`, cmd)
    switch (cmd.type) {
      case 'set_standby':
        closeCamera()
        set('STANDBY')
        break
      case 'resume':
        set('IDLE')
        break
      case 'initiate_call':
        console.log(`[KioskApp:${portalId}] initiate_call → peerId=${cmd.peerId}`)
        openCamera().then(() => {
          const stream = cameraStreamRef.current ?? undefined
          console.log(`[KioskApp:${portalId}] calling startCall with stream=${!!stream}`)
          startCall(cmd.peerId, stream).then(() => {
            console.log(`[KioskApp:${portalId}] startCall resolved, transitioning to ACTIVE`)
            set('ACTIVE')
          })
        })
        break
      case 'end_call':
        hangUp()
        closeCamera()
        set('IDLE')
        break
    }
  }, [portalId, set, startCall, hangUp, openCamera, closeCamera])

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
