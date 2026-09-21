import { useState } from 'react'
import type { ValidLocatedPlate } from '../domain/stabilizer'
import { ResultView } from '../result/ResultView'
import { ScannerView } from '../scanner/ScannerView'

export function App() {
  const [screen, setScreen] = useState<'start' | 'scanner' | 'result'>('start')
  const [result, setResult] = useState<ValidLocatedPlate | null>(null)
  if (screen === 'scanner') return <ScannerView onExit={() => setScreen('start')} onRecognized={(next) => { setResult(next); setScreen('result') }} />
  if (screen === 'result' && result) return <ResultView result={result} onScanAnother={() => setScreen('scanner')} />
  return <main className="start-page" dir="rtl"><div className="start-sign" aria-hidden="true">پلاک یاب ایران</div><h1>میخوای بدونی پلاک ماله کدوم شهره؟</h1><p>دوربین گوشی رو روبروی پلاک نگه دار!</p><p className="privacy">خیالت راحت! تصویر یا پلاک دخیره نمیشه!</p><button className="primary-button" type="button" onClick={() => setScreen('scanner')}>شروع اسکن</button></main>
}
