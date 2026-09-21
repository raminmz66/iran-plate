import { normalizeOcrText } from './normalize'

it.each([
  ['۱۲\u200cب\u200c۳۴۵ ایران ۱۰', '12 ب 345 ایران 10'],
  ['١٢\u200eب\u200e٣٤٥ ایران ١٠', '12 ب 345 ایران 10'],
])('normalizes %s', (input, expected) => {
  expect(normalizeOcrText(input)).toBe(expected)
})
