import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error'
export type CameraError = 'denied' | 'unavailable' | 'error'

const constraints: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<CameraError | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus((current) => current === 'ready' ? 'idle' : current)
  }, [])

  const start = useCallback(async () => {
    stop()
    setStatus('requesting')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.playsInline = true
        video.muted = true
        await video.play().catch(() => undefined)
      }
      setStatus('ready')
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : ''
      const nextError: CameraError = name === 'NotAllowedError' ? 'denied' : name === 'NotFoundError' ? 'unavailable' : 'error'
      setError(nextError)
      setStatus(nextError)
    }
  }, [stop])

  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden)
      stop()
    }
  }, [stop])

  return { status, error, videoRef, start, stop }
}
