import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WebRTCSignal } from '@/lib/types'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useWebRTC(portalId: string) {
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const channelRef     = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerIdRef      = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    channelRef.current?.unsubscribe()
    channelRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    peerIdRef.current = null
  }, [])

  const startCall = useCallback(async (peerId: string) => {
    cleanup()
    peerIdRef.current = peerId

    const supabase = createClient()
    const channelName = `webrtc:${[portalId, peerId].sort().join(':')}`

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    } catch (err) {
      console.error('[WebRTC] getUserMedia failed:', err)
      return
    }
    localStreamRef.current = stream
    setLocalStream(stream)

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc
    stream.getTracks().forEach(t => pc.addTrack(t, stream))
    pc.ontrack = (e) => setRemoteStream(e.streams[0])
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanup()
      }
    }

    const channel = supabase.channel(channelName)
    channelRef.current = channel

    function sendSignal(payload: WebRTCSignal) {
      channel.send({ type: 'broadcast', event: 'signal', payload })
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal({ type: 'candidate', from: portalId, to: peerId, candidate })
    }

    channel
      .on('broadcast', { event: 'signal' }, ({ payload }: { payload: WebRTCSignal }) => {
        if (payload.to !== portalId) return
        handleIncomingSignal(payload, pc, sendSignal, portalId)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sendSignal({ type: 'offer', from: portalId, to: peerId, sdp: offer.sdp })
      })
  }, [portalId, cleanup])

  const hangUp = useCallback(() => {
    if (channelRef.current && peerIdRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'hangup', from: portalId, to: peerIdRef.current } satisfies WebRTCSignal,
      })
    }
    cleanup()
  }, [portalId, cleanup])

  return { localStream, remoteStream, startCall, hangUp }
}

async function handleIncomingSignal(
  signal: WebRTCSignal,
  pc: RTCPeerConnection,
  sendSignal: (s: WebRTCSignal) => void,
  portalId: string,
) {
  try {
    if (signal.type === 'offer' && signal.sdp) {
      await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal({ type: 'answer', from: portalId, to: signal.from, sdp: answer.sdp })
    } else if (signal.type === 'answer' && signal.sdp) {
      await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
    } else if (signal.type === 'candidate' && signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
    }
  } catch (err) {
    console.error('[WebRTC] Signal handling error:', err)
  }
}
