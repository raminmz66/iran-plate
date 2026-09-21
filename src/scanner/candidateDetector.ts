export type PlateCrop = {
  image: ImageData
  bounds: { x: number; y: number; width: number; height: number }
}

export function isPlausiblePlate(candidate: { area: number; width: number; height: number }, guideArea: number) {
  const ratio = candidate.width / candidate.height
  return candidate.area >= guideArea * 0.03 && candidate.area <= guideArea * 0.6 && ratio >= 2.5 && ratio <= 6
}

export function findBestPlateCrop(frame: ImageData, guide: DOMRect): PlateCrop | null {
  const x = Math.max(0, Math.floor(guide.x))
  const y = Math.max(0, Math.floor(guide.y))
  const width = Math.min(Math.floor(guide.width), frame.width - x)
  const height = Math.min(Math.floor(guide.height), frame.height - y)
  if (width <= 0 || height <= 0) return null

  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let row = 0; row < height; row += 1) {
    const from = ((y + row) * frame.width + x) * 4
    pixels.set(frame.data.subarray(from, from + width * 4), row * width * 4)
  }
  return { image: new ImageData(pixels, width, height), bounds: { x, y, width, height } }
}
