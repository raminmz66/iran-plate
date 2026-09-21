import { parsePrivatePlate } from './plateParser'

it('extracts code and middle letter from a standard private plate reading', () => {
  expect(parsePrivatePlate({ text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 88 })).toMatchObject({
    kind: 'valid',
    plate: { iranCode: '10', middleLetter: 'ب', identity: '10:ب' },
  })
})

it('rejects a reading below 78 confidence', () => {
  expect(parsePrivatePlate({ text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 77 })).toEqual({
    kind: 'invalid',
    reason: 'confidence',
  })
})
