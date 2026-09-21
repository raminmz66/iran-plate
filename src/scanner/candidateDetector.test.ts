import { isPlausiblePlate } from './candidateDetector'

it('accepts a large quadrilateral with a private-plate aspect ratio', () => {
  expect(isPlausiblePlate({ area: 24000, width: 320, height: 80 }, 160000)).toBe(true)
})

it.each([{ width: 80, height: 240 }, { width: 120, height: 100 }, { width: 320, height: 25 }])(
  'rejects an implausible candidate %#',
  (candidate) => expect(isPlausiblePlate({ area: candidate.width * candidate.height, ...candidate }, 160000)).toBe(false),
)
