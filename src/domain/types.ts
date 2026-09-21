export type OcrReading = {
  text: string
  confidence: number
}

export type PrivatePlate = {
  display: string
  iranCode: string
  middleLetter: string
  identity: string
}

export type ParseResult =
  | { kind: 'valid'; plate: PrivatePlate }
  | { kind: 'invalid'; reason: 'format' | 'confidence' }
