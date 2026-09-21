import type { ValidLocatedPlate } from '../domain/stabilizer'

type Props = {
  result: ValidLocatedPlate
  onScanAnother(): void
}

export function ResultView({ result, onScanAnother }: Props) {
  const locations = result.resolution.locations
  const ambiguous = result.resolution.kind === 'ambiguous'

  return (
    <main className="result-page" dir="rtl">
      <div className="result-mark" aria-hidden="true">✓</div>
      <p className="result-kicker">پلاک خوانده شد</p>
      <output className="plate-display">{result.plate.display}</output>
      <h1>{ambiguous ? 'چند محل احتمالی' : locations[0].city}</h1>
      {ambiguous ? (
        <ul className="location-list">
          {locations.map((location) => <li key={`${location.city}-${location.province}`}>{location.city}، {location.province}</li>)}
        </ul>
      ) : <p className="province">استان {locations[0].province}</p>}
      <p className="disclaimer">یادت باشه این فقط محل صدور پلاکه، نه محل فعلی خودرو یا مالک اون!</p>
      <button className="primary-button" type="button" onClick={onScanAnother}>اسکن پلاک دیگر</button>
    </main>
  )
}
