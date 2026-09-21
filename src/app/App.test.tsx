import { render, screen } from '@testing-library/react'
import { App } from './App'

it('shows the privacy-focused start screen before camera access', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'شروع اسکن' })).toBeVisible()
  expect(screen.getByText('پلاک یاب ایران')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'میخوای بدونی پلاک ماله کدوم شهره؟' })).toBeVisible()
  expect(screen.getByText('دوربین گوشی رو روبروی پلاک نگه دار!')).toBeVisible()
  expect(screen.getByText('خیالت راحت! تصویر یا پلاک دخیره نمیشه!')).toBeVisible()
})
