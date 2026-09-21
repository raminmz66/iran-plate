import { render, screen } from '@testing-library/react'
import { App } from './App'

it('shows the privacy-focused start screen before camera access', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'شروع اسکن' })).toBeVisible()
  expect(screen.getByText(/تصویر یا پلاک شما ذخیره نمی‌شود/)).toBeVisible()
})
