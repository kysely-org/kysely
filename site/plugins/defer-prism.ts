import type { LoadContext, Plugin } from '@docusaurus/types'
import { createRequire } from 'node:module'
import { join } from 'pathe'

export default function deferPrism({
  siteDir,
  siteConfig,
}: LoadContext): Plugin {
  const require = createRequire(join(siteDir, 'package.json'))
  const prismClientModule = require.resolve(
    '@docusaurus/theme-classic/lib/prism-include-languages',
    { paths: [require.resolve('@docusaurus/preset-classic')] },
  )

  return {
    name: 'defer-prism',
    configureWebpack() {
      // Extra grammars need the theme's initialization. With only the bundled
      // languages, CodeBlock can load Prism through the documentation chunks.
      const prism = siteConfig.themeConfig.prism as {
        additionalLanguages?: string[]
      }
      if (prism.additionalLanguages?.length) return {}

      return { resolve: { alias: { [prismClientModule]: false } } }
    },
  }
}
