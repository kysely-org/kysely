import type { LoadContext, Plugin } from '@docusaurus/types'
import { createHash } from 'node:crypto'
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { join } from 'pathe'

export interface BrandLogoSpriteData {
  fileName: string
}

export default function generateBrandLogoSprite({
  generatedFilesDir,
  siteDir,
  siteConfig,
}: LoadContext): Plugin<BrandLogoSpriteData> {
  const sourceDir = join(siteDir, 'src/assets/brands')
  const outputDir = join(generatedFilesDir, 'brand-logos')

  return {
    name: 'generate-brand-logo-sprite',
    getPathsToWatch: () => [join(sourceDir, '*.svg')],
    async loadContent() {
      const files = (await readdir(sourceDir))
        .filter((file) => file.endsWith('.svg'))
        .sort()
      const logos = await Promise.all(
        files.map(async (file) => {
          const svg = await readFile(join(sourceDir, file), 'utf8')
          const match = svg.trim().match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/)
          if (!match) throw new Error(`Invalid brand SVG: ${file}`)

          // The filename supplies the ID; BrandLogoSvg supplies the viewBox.
          // Keep presentation attributes such as fill, stroke, and transform.
          const attributes = match[1].replace(
            /\s+(?:xmlns|viewBox|id)=("[^"]*"|'[^']*')/g,
            '',
          )
          return `<g id="${file.slice(0, -4)}"${attributes}>${match[2]}</g>`
        }),
      )
      const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${logos.join('\n')}\n</svg>\n`
      const hash = createHash('sha256').update(sprite).digest('hex').slice(0, 8)
      const fileName = `brand-logos.${hash}.svg`

      await rm(outputDir, { force: true, recursive: true })
      await mkdir(outputDir, { recursive: true })
      await writeFile(join(outputDir, fileName), sprite)

      return { fileName }
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content)
    },
    configureWebpack() {
      return {
        devServer: {
          static: [
            {
              directory: outputDir,
              publicPath: `${siteConfig.baseUrl}img`,
            },
          ],
        },
      }
    },
    async postBuild({ content, outDir }) {
      await mkdir(join(outDir, 'img'), { recursive: true })
      await copyFile(
        join(outputDir, content.fileName),
        join(outDir, 'img', content.fileName),
      )
    },
  }
}
