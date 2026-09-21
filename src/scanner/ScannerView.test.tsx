import { render, screen } from '@testing-library/react'
import { ScannerView } from './ScannerView'

vi.mock('../camera/useCamera', () => ({
  useCamera: () => ({ status: 'denied', error: 'denied', videoRef: { current: null }, start: vi.fn(), stop: vi.fn() }),
}))

it('gives a clear retryable message when camera permission is denied', () => {
  render(<ScannerView onRecognized={vi.fn()} onExit={vi.fn()} />)
  expect(screen.getByText(/اجازه‌ی دوربین داده نشده/)).toBeVisible()
  expect(screen.getByRole('button', { name: 'تلاش دوباره' })).toBeVisible()
})
