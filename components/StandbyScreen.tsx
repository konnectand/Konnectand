'use client'

interface Props { portalId: string }

export default function StandbyScreen({ portalId }: Props) {
  return (
    <div className="portal-state relative w-full h-full flex flex-col items-center justify-center gap-6 bg-[#09090F] overflow-hidden">

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 50% 35% at 50% 50%, rgba(139,127,245,0.05) 0%, transparent 65%)',
      }} />

      <div className="relative z-10 flex flex-col items-center gap-5 opacity-50">
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
          <circle cx="7"  cy="14" r="5" fill="#8B7FF5" />
          <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
          <path d="M12 14 Q14 8 16 14"  stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
          <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
        </svg>

        <div className="text-center">
          <p className="text-4xl font-light text-gray-400 tracking-wide">Volvemos pronto</p>
          <p className="text-sm text-gray-700 mt-3 tracking-widest uppercase font-mono">
            KonnectAND &middot; {portalId}
          </p>
        </div>
      </div>
    </div>
  )
}
