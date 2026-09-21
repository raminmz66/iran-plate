import { normalizeOcrText, toPersianDigits } from './normalize'
import type { OcrReading, ParseResult } from './types'

const PRIVATE_PLATE_LETTERS = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'
const PLATE_PATTERN = new RegExp(`^(\\d{2})\\s+([${PRIVATE_PLATE_LETTERS}])\\s+(\\d{3})\\s+ایران\\s+(\\d{2})$`)

export function parsePrivatePlate(reading: OcrReading): ParseResult {
  if (reading.confidence < 78) return { kind: 'invalid', reason: 'confidence' }

  const normalized = normalizeOcrText(reading.text)
  const match = normalized.match(PLATE_PATTERN)
  if (!match) return { kind: 'invalid', reason: 'format' }

  const [, leftDigits, middleLetter, serialDigits, iranCode] = match
  return {
    kind: 'valid',
    plate: {
      display: `${toPersianDigits(leftDigits)} ${middleLetter} ${toPersianDigits(serialDigits)} ایران ${toPersianDigits(iranCode)}`,
      iranCode,
      middleLetter,
      identity: `${iranCode}:${middleLetter}`,
    },
  }
}
