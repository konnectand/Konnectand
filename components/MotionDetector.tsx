'use client'

import { useEffect, useRef } from 'react'
import {
  MOTION_THRESHOLD,
  PIXEL_DIFF_THRESHOLD,
  MOTION_SAMPLE_INTERVAL_MS,
  MOTION_CANVAS_W,
  MOTION_CANVAS_H,
} from '@/lib/constants'

interface Props {
  onMotionDetected: () => void
}

export default function MotionDetector({ onMotionDetected }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const prevRef     = useRef<ImageData | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cbRef       = useRef(onMotionDetected)
  cbRef.current = onMotionDetected

  useEffect(() => {
    let mounted = true

    navigator.mediaDevices
      .getUserMedia({ video: { width: MOTION_CANVAS_W, height: MOTION_CANVAS_H, frameRate: { ideal: 5 } }, audio: false })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        intervalRef.current = setInterval(sample, MOTION_SAMPLE_INTERVAL_MS)
      })
      .catch(() => {
        // Camera unavailable — motion detection silently disabled
      })

    function sample() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, MOTION_CANVAS_W, MOTION_CANVAS_H)
      const frame = ctx.getImageData(0, 0, MOTION_CANVAS_W, MOTION_CANVAS_H)

      if (prevRef.current) {
        let changed = 0
        const total = frame.data.length / 4
        for (let i = 0; i < frame.data.length; i += 4) {
          const d =
            Math.abs(frame.data[i]   - prevRef.current.data[i])   +
            Math.abs(frame.data[i+1] - prevRef.current.data[i+1]) +
            Math.abs(frame.data[i+2] - prevRef.current.data[i+2])
          if (d > PIXEL_DIFF_THRESHOLD) changed++
        }
        if (changed / total > MOTION_THRESHOLD) cbRef.current()
      }
      prevRef.current = frame
    }

    return () => {
      mounted = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <>
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" width={MOTION_CANVAS_W} height={MOTION_CANVAS_H} />
    </>
  )
}
