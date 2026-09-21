export type PlateCrop = {
  image: ImageData
  bounds: { x: number; y: number; width: number; height: number }
}

export function isPlausiblePlate(candidate: { area: number; width: number; height: number }, guideArea: number) {
  const ratio = candidate.width / candidate.height
  return candidate.area >= guideArea * 0.03 && candidate.area <= guideArea * 0.6 && ratio >= 2.5 && ratio <= 6
}

export function findBrightPlateBounds(image: ImageData): { x: number; y: number; width: number; height: number } | null {
  let minX = image.width
  let minY = image.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    const offset = (y * image.width + x) * 4
    const luminance = image.data[offset] * 0.2126 + image.data[offset + 1] * 0.7152 + image.data[offset + 2] * 0.0722
    if (luminance < 175) continue
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

function cropImage(image: ImageData, bounds: { x: number; y: number; width: number; height: number }): ImageData {
  const pixels = new Uint8ClampedArray(bounds.width * bounds.height * 4)
  for (let row = 0; row < bounds.height; row += 1) {
    const from = ((bounds.y + row) * image.width + bounds.x) * 4
    pixels.set(image.data.subarray(from, from + bounds.width * 4), row * bounds.width * 4)
  }
  return new ImageData(pixels, bounds.width, bounds.height)
}

export function preprocessPlateForOcr(image: ImageData): ImageData {
  const targetWidth = Math.min(1280, image.width * 2)
  const targetHeight = Math.round(image.height * (targetWidth / image.width))
  let total = 0
  for (let index = 0; index < image.data.length; index += 4) total += image.data[index] * 0.2126 + image.data[index + 1] * 0.7152 + image.data[index + 2] * 0.0722
  const threshold = Math.min(220, Math.max(90, (total / (image.width * image.height)) * 0.78))
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4)
  for (let y = 0; y < targetHeight; y += 1) for (let x = 0; x < targetWidth; x += 1) {
    const sourceX = Math.min(image.width - 1, Math.floor(x * image.width / targetWidth))
    const sourceY = Math.min(image.height - 1, Math.floor(y * image.height / targetHeight))
    const source = (sourceY * image.width + sourceX) * 4
    const luminance = image.data[source] * 0.2126 + image.data[source + 1] * 0.7152 + image.data[source + 2] * 0.0722
    const value = luminance >= threshold ? 255 : 0
    const target = (y * targetWidth + x) * 4
    output[target] = output[target + 1] = output[target + 2] = value
    output[target + 3] = 255
  }
  return new ImageData(output, targetWidth, targetHeight)
}

export function findBestPlateCrop(frame: ImageData, guide: DOMRect): PlateCrop | null {
  const x = Math.max(0, Math.floor(guide.x))
  const y = Math.max(0, Math.floor(guide.y))
  const width = Math.min(Math.floor(guide.width), frame.width - x)
  const height = Math.min(Math.floor(guide.height), frame.height - y)
  if (width <= 0 || height <= 0) return null

  const guideImage = cropImage(frame, { x, y, width, height })
  const brightBounds = findBrightPlateBounds(guideImage)
  if (brightBounds && isPlausiblePlate({ area: brightBounds.width * brightBounds.height, ...brightBounds }, width * height)) {
    return { image: cropImage(guideImage, brightBounds), bounds: { x: x + brightBounds.x, y: y + brightBounds.y, width: brightBounds.width, height: brightBounds.height } }
  }
  return { image: guideImage, bounds: { x, y, width, height } }
}
