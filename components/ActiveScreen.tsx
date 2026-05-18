'use client'

import { useEffect, useRef, useState } from 'react'
import { PhoneOff, Wifi } from 'lucide-react'

interface Props {
  localStream:  MediaStream | null
  remoteStream: MediaStream | null
  onHangUp:     () => void
}

export default function ActiveScreen({ localStream, remoteStream, onHangUp }: Props) {
  const remoteRef = useRef<HTMLVideoElement>(null)
  const localRef  = useRef<HTMLVideoElement>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    console.log('[ActiveScreen] mounted — localStream:', !!localStream, 'remoteStream:', !!remoteStream)
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => {
      console.log('[ActiveScreen] unmounted')
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    console.log('[ActiveScreen] remoteStream changed:', remoteStream
      ? `${remoteStream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', ')}`
      : 'null')
    if (!remoteRef.current || !remoteStream) return
    remoteRef.current.srcObject = remoteStream
    remoteRef.current.play()
      .then(() => console.log('[ActiveScreen] remote video playing'))
      .catch(err => console.error('[ActiveScreen] remote video play() failed:', err))
  }, [remoteStream])

  useEffect(() => {
    console.log('[ActiveScreen] localStream changed:', localStream
      ? `${localStream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', ')}`
      : 'null')
    if (!localRef.current || !localStream) return
    localRef.current.srcObject = localStream
    localRef.current.play()
      .then(() => console.log('[ActiveScreen] local video playing'))
      .catch(err => console.error('[ActiveScreen] local video play() failed:', err))
  }, [localStream])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="portal-state relative w-full h-full bg-black overflow-hidden">
      <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

      {!remoteStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090F] gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#8B7FF5] border-t-transparent animate-spin" />
          <p className="text-gray-400 text-lg">Estableciendo conexion...</p>
        </div>
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2 rounded-full"
           style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Wifi className="w-3.5 h-3.5 text-[#2DD4A8]" />
        <div className="w-2 h-2 rounded-full bg-[#2DD4A8] animate-pulse" />
        <span className="text-white text-sm font-mono tabular-nums">{fmt(elapsed)}</span>
      </div>

      <div
        className="absolute bottom-8 right-8 w-52 h-40 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!localStream && (
          <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
            <span className="text-xs text-gray-600">Sin camara</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={onHangUp}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-90 shadow-lg"
          style={{ boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}
