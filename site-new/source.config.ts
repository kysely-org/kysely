import { defineDocs, defineConfig } from 'fumadocs-mdx/config'
import { remarkInstall } from 'fumadocs-docgen'

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkInstall],
  },
})
