import { normalizeOcrText, toPersianDigits } from './normalize'
import type { OcrReading, ParseResult } from './types'

const PRIVATE_PLATE_LETTERS = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'
const VISUAL_PLATE_PATTERN = new RegExp(`^(\\d{2})\\s+([${PRIVATE_PLATE_LETTERS}])\\s+(\\d{3})\\s+ایران\\s+(\\d{2})$`)
const LOGICAL_RTL_PLATE_PATTERN = new RegExp(`^(\\d{2})\\s+ایران\\s+(\\d{3})\\s+([${PRIVATE_PLATE_LETTERS}])\\s+(\\d{2})$`)

export function parsePrivatePlate(reading: OcrReading): ParseResult {
  if (reading.confidence < 78) return { kind: 'invalid', reason: 'confidence' }

  const normalized = normalizeOcrText(reading.text)
  const visualMatch = normalized.match(VISUAL_PLATE_PATTERN)
  const logicalRtlMatch = normalized.match(LOGICAL_RTL_PLATE_PATTERN)
  if (!visualMatch && !logicalRtlMatch) return { kind: 'invalid', reason: 'format' }

  const [, first, second, third, fourth] = visualMatch ?? logicalRtlMatch!
  const [leftDigits, middleLetter, serialDigits, iranCode] = visualMatch
    ? [first, second, third, fourth]
    : [fourth, third, second, first]
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
