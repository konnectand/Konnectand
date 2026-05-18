'use client'

import { useEffect, useState } from 'react'
import QRCode         from './QRCode'
import MotionDetector from './MotionDetector'

const LOGO_SVG = (
  <svg width="52" height="52" viewBox="0 0 28 28" fill="none">
    <circle cx="7"  cy="14" r="5" fill="#8B7FF5" />
    <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
    <path d="M12 14 Q14 8 16 14"  stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
    <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
  </svg>
)

interface Props {
  portalId: string
  onMotionDetected: () => void
}

export default function IdleScreen({ portalId, onMotionDetected }: Props) {
  const qrUrl = `https://konnectand.ad/portal/${portalId}`

  return (
    <div className="portal-state relative w-full h-full overflow-hidden bg-[#09090F]">
      <div className="ambient-orb absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(139,127,245,0.14) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 35% at 85% 95%, rgba(45,212,168,0.06) 0%, transparent 55%)',
      }} />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-56 h-56 rounded-full border border-[#8B7FF5]/8 animate-ping"
               style={{ animationDuration: '4s' }} />
          <div className="absolute w-40 h-40 rounded-full border border-[#8B7FF5]/12 animate-ping"
               style={{ animationDuration: '3s', animationDelay: '0.5s' }} />

          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center animate-breathe"
            style={{
              background: 'rgba(139,127,245,0.08)',
              border:     '1px solid rgba(139,127,245,0.2)',
              boxShadow:  '0 0 80px rgba(139,127,245,0.18), inset 0 0 20px rgba(139,127,245,0.05)',
            }}
          >
            {LOGO_SVG}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight">KonnectAND</h1>
          <p className="text-lg text-[#2DD4A8]/80 mt-2 font-light tracking-wide">
            Portales Experienciales
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="w-1 h-1 rounded-full bg-[#8B7FF5]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B7FF5]/60" />
          <div className="w-1 h-1 rounded-full bg-[#8B7FF5]/40" />
        </div>
      </div>

      <div className="absolute top-7 left-7 font-mono text-xs text-gray-700 tracking-widest uppercase">
        {portalId}
      </div>

      <ClockDisplay />

      <div className="absolute bottom-7 right-7 flex flex-col items-end gap-2">
        <div
          className="p-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <QRCode value={qrUrl} size={88} />
        </div>
        <span className="text-xs text-gray-700">konnectand.ad</span>
      </div>

      <MotionDetector onMotionDetected={onMotionDetected} />
    </div>
  )
}

function ClockDisplay() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="clock absolute bottom-7 left-7 text-3xl font-thin text-gray-700 tabular-nums">
      {time}
    </div>
  )
}
