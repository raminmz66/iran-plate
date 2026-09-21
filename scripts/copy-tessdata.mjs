import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('public/tessdata', { recursive: true })
await copyFile(
  'node_modules/@tesseract.js-data/fas/4.0.0_best_int/fas.traineddata.gz',
  'public/tessdata/fas.traineddata.gz',
)
