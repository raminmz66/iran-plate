const { worker } = vi.hoisted(() => ({
  worker: {
    setParameters: vi.fn(),
    recognize: vi.fn().mockResolvedValue({ data: { text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 92 } }),
    terminate: vi.fn(),
  },
}))

vi.mock('tesseract.js', () => ({ createWorker: vi.fn().mockResolvedValue(worker) }))

import { createOcrService } from './ocrService'

beforeEach(() => vi.clearAllMocks())

it('configures Persian OCR for a single plate line', async () => {
  const service = await createOcrService()
  await service.recognize({} as ImageData)
  expect(worker.setParameters).toHaveBeenCalledWith(expect.objectContaining({ tessedit_pageseg_mode: '7' }))
  expect(worker.recognize).toHaveBeenCalled()
})

it('terminates the worker exactly once', async () => {
  const service = await createOcrService()
  await service.terminate()
  await service.terminate()
  expect(worker.terminate).toHaveBeenCalledTimes(1)
})
