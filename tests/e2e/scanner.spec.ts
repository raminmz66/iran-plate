import { expect, test } from '@playwright/test'

test('requests camera only after start and gives a clear permission fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
    })
  })
  await page.goto('/')
  await expect(page.getByText('خیالت راحت! تصویر یا پلاک دخیره نمیشه!')).toBeVisible()
  await page.getByRole('button', { name: 'شروع اسکن' }).click()
  await expect(page.getByText(/اجازه‌ی دوربین داده نشده/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'دوباره تلاش کن' })).toBeVisible()
})
