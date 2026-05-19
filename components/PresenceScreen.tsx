'use client'

import CountdownRing from './CountdownRing'
import { PRESENCE_COUNTDOWN_S } from '@/lib/constants'

const LOGO_SVG = (
  <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
    <circle cx="7"  cy="14" r="5" fill="#8B7FF5" />
    <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
    <path d="M12 14 Q14 8 16 14"  stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
    <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
  </svg>
)

interface Props {
  portalId:    string
  onExpired:   () => void
  onActivated: () => void
}

export default function PresenceScreen({ portalId, onExpired, onActivated }: Props) {
  return (
    <div className="portal-state relative w-full h-full flex flex-col items-center justify-center gap-10 bg-[#09090F] overflow-hidden">

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[3.5, 2.8, 2.2].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-[#8B7FF5]/15 animate-ping"
            style={{
              width:  `${(i + 1) * 160}px`,
              height: `${(i + 1) * 160}px`,
              animationDuration: `${delay}s`,
              animationDelay:    `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,127,245,0.12) 0%, transparent 65%)',
      }} />

      <div
        className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center animate-pulse-glow"
        style={{
          background: 'rgba(139,127,245,0.1)',
          border:     '1px solid rgba(139,127,245,0.3)',
        }}
      >
        {LOGO_SVG}
      </div>

      <div className="relative z-10 text-center animate-slide-up">
        <h2 className="text-6xl font-bold text-white">Hola!</h2>
        <p className="text-xl text-[#8B7FF5] mt-4 font-light">
          Conectando con otra ubicacion de Andorra...
        </p>
        <p className="text-sm text-gray-600 mt-2 tracking-widest uppercase">{portalId}</p>
      </div>

      <div className="relative z-10">
        <CountdownRing totalSeconds={PRESENCE_COUNTDOWN_S} onExpired={onExpired} size={110} />
      </div>

      <button
        onClick={onActivated}
        className="relative z-10 px-12 py-4 rounded-full text-white font-semibold text-lg transition-all active:scale-95"
        style={{
          background: '#8B7FF5',
          boxShadow:  '0 0 50px rgba(139,127,245,0.5)',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#7B6FE5')}
        onMouseOut={e  => (e.currentTarget.style.background = '#8B7FF5')}
      >
        Conectar ahora
      </button>
    </div>
  )
}
