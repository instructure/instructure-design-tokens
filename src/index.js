import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { globSync } from 'glob'

const __dirname = dirname(fileURLToPath(import.meta.url))

const tokensDir = join(__dirname, '..', 'tokenStudio')

// Nested object mirroring the tokenStudio/ directory structure
export const themeTokens = {}

for (const filePath of globSync('**/*.json', { cwd: tokensDir })) {
  const tokens = JSON.parse(readFileSync(join(tokensDir, filePath), 'utf8'))
  // e.g. 'canvas/semantic/color/canvas.json' -> ['canvas', 'semantic', 'color', 'canvas']
  const keys = filePath.replace(/\.json$/, '').split('/')

  let node = themeTokens
  for (const key of keys.slice(0, -1)) {
    node[key] ??= {}
    node = node[key]
  }
  node[keys.at(-1)] = tokens
}