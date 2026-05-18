'use client'

import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'

interface Props {
  value: string
  size?: number
}

export default function QRCode({ value, size = 128 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCodeLib.toDataURL(value, {
      width:  size * 2,
      margin: 1,
      color:  { dark: '#FFFFFFFF', light: '#00000000' },
    })
      .then(setDataUrl)
      .catch(console.error)
  }, [value, size])

  if (!dataUrl) return <div style={{ width: size, height: size }} />

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
