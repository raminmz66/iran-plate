import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../camera/useCamera'
import { lookupLocation } from '../domain/locationLookup'
import { parsePrivatePlate } from '../domain/plateParser'
import { createStabilizer, type ValidLocatedPlate } from '../domain/stabilizer'
import { findBestPlateCrop, preprocessPlateForOcr } from './candidateDetector'
import { createOcrService, type OcrService } from './ocrService'
import { createDebugGate, formatDebugSnapshot, isDebugMode, type DebugSnapshot } from './debug'

type Props = { onRecognized(result: ValidLocatedPlate): void; onExit(): void }

export function ScannerView({ onRecognized, onExit }: Props) {
  const { status: cameraStatus, videoRef, start, stop } = useCamera()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const serviceRef = useRef<OcrService | null>(null)
  const sessionRef = useRef(0)
  const processingRef = useRef(false)
  const [status, setStatus] = useState('پلاک رو داخل کادر نگه دار')
  const debugMode = isDebugMode(window.location.search)
  const [debug, setDebug] = useState<DebugSnapshot>({ parser: 'در انتظار OCR' })
  const debugGateRef = useRef(createDebugGate(debugMode))
  const [debugPaused, setDebugPaused] = useState(false)
  const updateDebug = (snapshot: DebugSnapshot) => { if (debugMode) setDebug(snapshot) }

  useEffect(() => {
    void start()
    return () => {
      sessionRef.current += 1
      void serviceRef.current?.terminate()
      stop()
    }
  // Camera functions are stable hook callbacks; this session starts on mount only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, stop])

  useEffect(() => {
    if (cameraStatus !== 'ready') return
    let cancelled = false
    const session = ++sessionRef.current
    const stabilizer = createStabilizer()

    const scan = async () => {
      if (cancelled || processingRef.current || !debugGateRef.current.canScan()) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return
      processingRef.current = true
      let attemptedOcr = false
      try {
        setStatus('در حال خواندن…')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return
        context.drawImage(video, 0, 0)
        const frame = context.getImageData(0, 0, canvas.width, canvas.height)
        const guide = new DOMRect(canvas.width * 0.1, canvas.height * 0.4, canvas.width * 0.8, canvas.height * 0.2)
        const crop = findBestPlateCrop(frame, guide)
        if (!crop) { updateDebug({ parser: 'کادر نامعتبر' }); setStatus('پلاک رو داخل کادر نگه دار'); return }
        serviceRef.current ??= await createOcrService()
        attemptedOcr = true
        const reading = await serviceRef.current.recognize(preprocessPlateForOcr(crop.image))
        if (cancelled || session !== sessionRef.current) return
        const parsed = parsePrivatePlate(reading)
        if (parsed.kind === 'invalid') { updateDebug({ rawText: reading.text, confidence: reading.confidence, parser: parsed.reason }); setStatus('نور یا فاصله را بهتر کنید'); return }
        const resolution = lookupLocation(parsed.plate.identity)
        if (resolution.kind === 'unknown') { updateDebug({ rawText: reading.text, confidence: reading.confidence, parser: 'معتبر', lookup: 'ناشناخته' }); setStatus('پلاک رو داخل کادر نگه دار'); return }
        updateDebug({ rawText: reading.text, confidence: reading.confidence, parser: 'معتبر', lookup: resolution.kind })
        const result = stabilizer.observe({ plate: parsed.plate, resolution })
        if (!result) { setStatus('در حال تأیید پلاک…'); return }
        cancelled = true
        stop()
        await serviceRef.current?.terminate()
        onRecognized(result)
      } catch {
        if (!cancelled) { updateDebug({ parser: 'خطا', error: 'OCR اجرا نشد' }); setStatus('نور یا فاصله را بهتر کنید') }
      } finally {
        processingRef.current = false
        if (attemptedOcr && debugMode) {
          debugGateRef.current.pause()
          setDebugPaused(true)
        }
      }
    }

    const timer = window.setInterval(() => void scan(), 650)
    void scan()
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [cameraStatus, onRecognized, stop, videoRef])

  const errorCopy = cameraStatus === 'denied'
    ? 'اجازه‌ی دوربین داده نشده است. از تنظیمات مرورگر آن را فعال کنید.'
    : cameraStatus === 'unavailable'
      ? 'دوربین مناسب پیدا نشد.'
      : cameraStatus === 'error'
        ? 'دوربین راه‌اندازی نشد.'
        : null

  if (errorCopy) return (
    <main className="scanner-error" dir="rtl">
      <h1>دوربین در دسترس نیست</h1><p>{errorCopy}</p>
      <button className="primary-button" type="button" onClick={() => void start()}>دوباره تلاش کن</button>
      <button className="text-button" type="button" onClick={onExit}>بازگشت</button>
    </main>
  )

  return (
    <main className="scanner-page" dir="rtl">
      <video ref={videoRef} className="camera-preview" aria-label="پیش‌نمایش دوربین" />
      <canvas ref={canvasRef} hidden />
      <div className="scanner-shade" aria-hidden="true" />
      <header className="scanner-header"><strong>پلاک‌یاب</strong><button type="button" onClick={onExit} aria-label="بستن اسکن">×</button></header>
      <div className="plate-guide" aria-hidden="true" />
      {debugMode && <output className="debug-panel">{formatDebugSnapshot(debug).map((line) => <span key={line}>{line}</span>)}{debugPaused && <button type="button" onClick={() => { debugGateRef.current.resume(); setDebugPaused(false) }}>ادامه اسکن</button>}</output>}
      <p className="scanner-status" aria-live="polite">{cameraStatus === 'requesting' ? 'در حال دریافت اجازه‌ی دوربین…' : status}</p>
      <p className="scanner-hint">پلاک رو روبرو و داخل کادر نگه دار</p>
    </main>
  )
}
