import { createHash } from 'node:crypto'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Lives next to webpack's persistent cache so both are restored or cleared
// together. File names are content hashes, so a cached MDX page can only ever
// reference the popups it was compiled with.
const directory = fileURLToPath(
  new URL('../node_modules/.cache/twoslash-popups/', import.meta.url),
)
const publicPath = '/twoslash'

export async function writePopups(popups) {
  const json = JSON.stringify(popups)
  const name = `${createHash('sha256').update(json).digest('hex').slice(0, 16)}.json`
  await mkdir(directory, { recursive: true })
  await writeFile(`${directory}${name}`, json)
  return `${publicPath}/${name}`
}

export default function twoslashPopups() {
  return {
    name: 'twoslash-popups',
    configureWebpack: () => ({
      devServer: { static: [{ directory, publicPath }] },
    }),
    async postBuild({ outDir }) {
      await mkdir(directory, { recursive: true })
      await cp(directory, `${outDir}${publicPath}`, { recursive: true })
    },
  }
}
