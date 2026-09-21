import { findBrightPlateBounds, isPlausiblePlate, preprocessPlateForOcr } from './candidateDetector'

it('accepts a large quadrilateral with a private-plate aspect ratio', () => {
  expect(isPlausiblePlate({ area: 24000, width: 320, height: 80 }, 160000)).toBe(true)
})

it.each([{ width: 80, height: 240 }, { width: 120, height: 100 }, { width: 320, height: 25 }])(
  'rejects an implausible candidate %#',
  (candidate) => expect(isPlausiblePlate({ area: candidate.width * candidate.height, ...candidate }, 160000)).toBe(false),
)

it('finds a bright plate-shaped region inside a darker guide frame', () => {
  const width = 10
  const height = 6
  const data = new Uint8ClampedArray(width * height * 4).fill(30)
  for (let y = 2; y < 4; y += 1) for (let x = 2; x < 8; x += 1) {
    const pixel = (y * width + x) * 4
    data[pixel] = data[pixel + 1] = data[pixel + 2] = 240
    data[pixel + 3] = 255
  }
  expect(findBrightPlateBounds({ data, width, height } as ImageData)).toEqual({ x: 2, y: 2, width: 6, height: 2 })
})

it('upscales and binarizes a plate crop for OCR', () => {
  class TestImageData {
    data: Uint8ClampedArray
    width: number
    height: number
    constructor(data: Uint8ClampedArray, width: number, height: number) { this.data = data; this.width = width; this.height = height }
  }
  vi.stubGlobal('ImageData', TestImageData)
  const image = { width: 2, height: 1, data: new Uint8ClampedArray([20, 20, 20, 255, 240, 240, 240, 255]) } as ImageData
  const output = preprocessPlateForOcr(image)
  expect(output).toMatchObject({ width: 4, height: 2 })
  expect([...output.data.filter((_, index) => index % 4 === 0)]).toEqual([0, 0, 255, 255, 0, 0, 255, 255])
  vi.unstubAllGlobals()
})
