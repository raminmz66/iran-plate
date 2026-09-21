import { useState } from 'react'
import type { ValidLocatedPlate } from '../domain/stabilizer'
import { ResultView } from '../result/ResultView'
import { ScannerView } from '../scanner/ScannerView'

export function App() {
  const [screen, setScreen] = useState<'start' | 'scanner' | 'result'>('start')
  const [result, setResult] = useState<ValidLocatedPlate | null>(null)
  if (screen === 'scanner') return <ScannerView onExit={() => setScreen('start')} onRecognized={(next) => { setResult(next); setScreen('result') }} />
  if (screen === 'result' && result) return <ResultView result={result} onScanAnother={() => setScreen('scanner')} />
  return <main className="start-page" dir="rtl"><div className="start-sign" aria-hidden="true">ایران</div><h1>شهر پلاک را پیدا کنید</h1><p>دوربین را روبه‌روی پلاک خودرو نگه دارید. نتیجه روی گوشی شما پردازش می‌شود.</p><p className="privacy">تصویر یا پلاک شما ذخیره نمی‌شود.</p><button className="primary-button" type="button" onClick={() => setScreen('scanner')}>شروع اسکن</button></main>
}
