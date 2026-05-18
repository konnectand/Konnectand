'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  totalSeconds: number
  onExpired: () => void
  size?: number
}

export default function CountdownRing({ totalSeconds, onExpired, size = 100 }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  useEffect(() => {
    if (remaining <= 0) { onExpiredRef.current(); return }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const r            = size / 2 - 6
  const circumference = 2 * Math.PI * r
  const filled       = ((totalSeconds - remaining) / totalSeconds) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(139,127,245,0.15)" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#8B7FF5" strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={filled}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="relative text-3xl font-bold text-white tabular-nums">{remaining}</span>
    </div>
  )
}
