import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

it('loads local Vazirmatn font weights for Persian UI copy', async () => {
  const styles = await readFile(resolve(process.cwd(), 'src/styles.css'), 'utf8')
  expect(styles).toContain("@import '@fontsource/vazirmatn/400.css'")
  expect(styles).toContain("@import '@fontsource/vazirmatn/700.css'")
})
