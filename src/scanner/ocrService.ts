import { createWorker } from 'tesseract.js'
import type { OcrReading } from '../domain/types'

export type OcrService = {
  recognize(crop: ImageData): Promise<OcrReading>
  terminate(): Promise<void>
}

const whitelist = '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩0123456789ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی ایران'

export async function createOcrService(): Promise<OcrService> {
  const worker = await createWorker('fas', 1, { langPath: '/tessdata', cacheMethod: 'write' })
  await worker.setParameters({ tessedit_pageseg_mode: '7', tessedit_char_whitelist: whitelist })
  let terminated = false
  let queue = Promise.resolve()

  return {
    recognize(crop) {
      const request = queue.then(async () => {
        if (terminated) throw new Error('OCR service has been terminated')
        const result = await worker.recognize(crop)
        return { text: result.data.text, confidence: result.data.confidence }
      })
      queue = request.then(() => undefined, () => undefined)
      return request
    },
    async terminate() {
      if (terminated) return
      terminated = true
      await queue
      await worker.terminate()
    },
  }
}
