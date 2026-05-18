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

  // preserveStream=true skips stopping tracks — used when the caller owns the stream lifecycle
  const cleanup = useCallback((preserveStream = false) => {
    console.log(`[WebRTC:${portalId}] cleanup(preserveStream=${preserveStream})`)
    pcRef.current?.close()
    pcRef.current = null
    channelRef.current?.unsubscribe()
    channelRef.current = null
    if (!preserveStream) {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    setRemoteStream(null)
    peerIdRef.current = null
  }, [portalId])

  // existingStream: pass a pre-opened stream to avoid re-requesting camera permission
  const startCall = useCallback(async (peerId: string, existingStream?: MediaStream) => {
    console.log(`[WebRTC:${portalId}] startCall → peer=${peerId} existingStream=${!!existingStream}`)
    cleanup(!!existingStream)
    peerIdRef.current = peerId

    const supabase = createClient()
    const channelName = `webrtc:${[portalId, peerId].sort().join(':')}`
    console.log(`[WebRTC:${portalId}] channel=${channelName}`)

    let stream: MediaStream
    if (existingStream) {
      stream = existingStream
      console.log(`[WebRTC:${portalId}] reusing existing stream — tracks: ${stream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', ')}`)
    } else {
      console.log(`[WebRTC:${portalId}] calling getUserMedia...`)
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        console.log(`[WebRTC:${portalId}] getUserMedia OK — tracks: ${stream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', ')}`)
      } catch (err) {
        console.error(`[WebRTC:${portalId}] getUserMedia failed:`, err)
        return
      }
    }
    localStreamRef.current = stream
    setLocalStream(stream)
    console.log(`[WebRTC:${portalId}] localStream set`)

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc
    stream.getTracks().forEach(t => {
      pc.addTrack(t, stream)
      console.log(`[WebRTC:${portalId}] addTrack ${t.kind}`)
    })

    pc.ontrack = (e) => {
      console.log(`[WebRTC:${portalId}] ontrack — streams: ${e.streams.length}, kind=${e.track.kind}`)
      setRemoteStream(e.streams[0])
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`[WebRTC:${portalId}] ICE candidate → ${peerId}: ${candidate.candidate.slice(0, 60)}...`)
        sendSignal({ type: 'candidate', from: portalId, to: peerId, candidate })
      } else {
        console.log(`[WebRTC:${portalId}] ICE gathering complete`)
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC:${portalId}] ICE state: ${pc.iceConnectionState}`)
    }

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC:${portalId}] connection state: ${pc.connectionState}`)
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`[WebRTC:${portalId}] connection lost — cleaning up`)
        cleanup()
      }
    }

    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC:${portalId}] signaling state: ${pc.signalingState}`)
    }

    const channel = supabase.channel(channelName)
    channelRef.current = channel

    function sendSignal(payload: WebRTCSignal) {
      console.log(`[WebRTC:${portalId}] → sendSignal type=${payload.type} to=${payload.to}`)
      channel.send({ type: 'broadcast', event: 'signal', payload })
    }

    channel
      .on('broadcast', { event: 'signal' }, ({ payload }: { payload: WebRTCSignal }) => {
        console.log(`[WebRTC:${portalId}] ← broadcast type=${payload.type} from=${payload.from} to=${payload.to}`)
        if (payload.to !== portalId) {
          console.log(`[WebRTC:${portalId}] ignoring signal (not for us)`)
          return
        }
        handleIncomingSignal(payload, pc, sendSignal, portalId)
      })
      .subscribe(async (status) => {
        console.log(`[WebRTC:${portalId}] channel status: ${status}`)
        if (status !== 'SUBSCRIBED') return

        // Only the lexicographically smaller portal ID acts as offerer.
        // This prevents signaling collisions when both portals call startCall simultaneously.
        const isOfferer = portalId < peerId
        console.log(`[WebRTC:${portalId}] isOfferer=${isOfferer} (${portalId} vs ${peerId})`)

        if (!isOfferer) {
          console.log(`[WebRTC:${portalId}] waiting for offer from ${peerId}...`)
          return
        }

        console.log(`[WebRTC:${portalId}] creating offer...`)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        console.log(`[WebRTC:${portalId}] offer created, sending to ${peerId}`)
        sendSignal({ type: 'offer', from: portalId, to: peerId, sdp: offer.sdp })
      })
  }, [portalId, cleanup])

  const hangUp = useCallback(() => {
    console.log(`[WebRTC:${portalId}] hangUp`)
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
  console.log(`[WebRTC:${portalId}] handleIncomingSignal type=${signal.type} signalingState=${pc.signalingState}`)
  try {
    if (signal.type === 'offer' && signal.sdp) {
      await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
      console.log(`[WebRTC:${portalId}] remote offer set, creating answer...`)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      console.log(`[WebRTC:${portalId}] answer ready, sending to ${signal.from}`)
      sendSignal({ type: 'answer', from: portalId, to: signal.from, sdp: answer.sdp })
    } else if (signal.type === 'answer' && signal.sdp) {
      await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
      console.log(`[WebRTC:${portalId}] remote answer set`)
    } else if (signal.type === 'candidate' && signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
      console.log(`[WebRTC:${portalId}] ICE candidate added`)
    } else if (signal.type === 'hangup') {
      console.log(`[WebRTC:${portalId}] received hangup from ${signal.from}`)
    }
  } catch (err) {
    console.error(`[WebRTC:${portalId}] signal handling error:`, err)
  }
}
