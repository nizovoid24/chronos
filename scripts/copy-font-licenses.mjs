import { copyFile, mkdir, access } from 'node:fs/promises'
import { resolve } from 'node:path'

await mkdir('public/licenses', { recursive: true })
for (const font of ['cormorant-garamond', 'manrope']) {
  const directory = resolve('node_modules/@fontsource', font)
  let found = false
  for (const name of ['LICENSE', 'LICENSE.txt', 'OFL.txt', 'OFL.txt.txt']) {
    try { await access(resolve(directory, name)) } catch { continue }
    await copyFile(resolve(directory, name), resolve('public/licenses', `${font}-LICENSE.txt`))
    found = true
    break
  }
  if (!found) throw new Error(`Font license missing: ${font}`)
}
