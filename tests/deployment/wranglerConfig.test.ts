import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type WranglerConfig = {
  name: string
  assets: { directory: string }
}

it('configures iran-plate static assets for the Cloudflare Worker', async () => {
  const configPath = resolve(process.cwd(), 'wrangler.jsonc')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as WranglerConfig
  expect(config).toMatchObject({ name: 'iran-plate', assets: { directory: './dist' } })
})
