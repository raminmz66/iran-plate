const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function normalizeOcrText(raw: string): string {
  return [...raw.replace(/[\u200c\u200e\u200f]/g, ' ')]
    .map((character) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(character)
      if (persianIndex >= 0) return String(persianIndex)
      const arabicIndex = ARABIC_DIGITS.indexOf(character)
      if (arabicIndex >= 0) return String(arabicIndex)
      return character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toPersianDigits(value: string): string {
  return [...value]
    .map((character) => /\d/.test(character) ? PERSIAN_DIGITS[Number(character)] : character)
    .join('')
}
