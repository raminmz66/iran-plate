import { render, screen } from '@testing-library/react'
import { ResultView } from './ResultView'
import type { ValidLocatedPlate } from '../domain/stabilizer'

const plate10Be: ValidLocatedPlate = {
  plate: { display: '۱۲ ب ۳۴۵ ایران ۱۰', iranCode: '10', middleLetter: 'ب', identity: '10:ب' },
  resolution: { kind: 'resolved', locations: [{ city: 'تهران', province: 'تهران', sourceId: 'pishkhanak' }] },
}

it('shows city and province for a resolved result', () => {
  render(<ResultView result={plate10Be} onScanAnother={vi.fn()} />)
  expect(screen.getByText('تهران')).toBeVisible()
  expect(screen.getByRole('button', { name: 'اسکن پلاک دیگر' })).toBeVisible()
  expect(screen.getByText('یادت باشه این فقط محل صدور پلاکه، نه محل فعلی خودرو یا مالک اون!')).toBeVisible()
})

it('shows every mapped location for an ambiguous result', () => {
  render(<ResultView result={{ ...plate10Be, resolution: { kind: 'ambiguous', locations: [
    plate10Be.resolution.locations[0],
    { city: 'کرج', province: 'البرز', sourceId: 'pedal' },
  ] } }} onScanAnother={vi.fn()} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
