import { formatDebugSnapshot, isDebugMode } from './debug'

it('enables local OCR diagnostics only with debug=1', () => {
  expect(isDebugMode('?debug=1')).toBe(true)
  expect(isDebugMode('?debug=0')).toBe(false)
})

it('formats OCR text and confidence without storing a scan', () => {
  expect(formatDebugSnapshot({ rawText: '۱۱ ایران ۳۴۵ ب ۱۲', confidence: 64, parser: 'format' }))
    .toEqual(['OCR: ۱۱ ایران ۳۴۵ ب ۱۲', 'اطمینان: 64', 'تحلیل پلاک: format'])
})
