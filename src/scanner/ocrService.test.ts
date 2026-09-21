const { worker } = vi.hoisted(() => ({
  worker: {
    setParameters: vi.fn(),
    recognize: vi.fn().mockResolvedValue({ data: { text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 92 } }),
    terminate: vi.fn(),
  },
}))

vi.mock('tesseract.js', () => ({ createWorker: vi.fn().mockResolvedValue(worker), PSM: { SINGLE_LINE: '7' } }))

const { createWorker } = await import('tesseract.js')

import { createOcrService } from './ocrService'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ putImageData: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['plate'])))
})

it('configures Persian OCR for a single plate line', async () => {
  const service = await createOcrService()
  await service.recognize({ width: 10, height: 10 } as ImageData)
  expect(worker.setParameters).toHaveBeenCalledWith(expect.objectContaining({ tessedit_pageseg_mode: '7' }))
  expect(worker.recognize).toHaveBeenCalled()
  expect(createWorker).toHaveBeenCalledWith('fas', 1, expect.objectContaining({ langPath: '/tessdata' }))
})

it('terminates the worker exactly once', async () => {
  const service = await createOcrService()
  await service.terminate()
  await service.terminate()
  expect(worker.terminate).toHaveBeenCalledTimes(1)
})
