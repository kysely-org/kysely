import type { LoadContext, Plugin } from '@docusaurus/types'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'

export default function generateBrandLogoSprite({
  generatedFilesDir,
  siteDir,
  siteConfig,
}: LoadContext): Plugin {
  const sourceDir = join(siteDir, 'src/assets/brands')
  const outputDir = join(generatedFilesDir, 'brand-logos')
  const outputFile = join(outputDir, 'brand-logos.svg')

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
      await mkdir(outputDir, { recursive: true })
      await writeFile(
        outputFile,
        `<svg xmlns="http://www.w3.org/2000/svg">\n${logos.join('\n')}\n</svg>\n`,
      )
    },
    // Docusaurus merges this dev-server setting although its webpack type omits it.
    configureWebpack() {
      return {
        devServer: {
          static: {
            directory: outputDir,
            publicPath: `${siteConfig.baseUrl}img`,
          },
        },
      } as never
    },
    async postBuild({ outDir }) {
      await mkdir(join(outDir, 'img'), { recursive: true })
      await copyFile(outputFile, join(outDir, 'img/brand-logos.svg'))
    },
  }
}
