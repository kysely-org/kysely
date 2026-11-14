import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
const root = fileURLToPath(new URL('../../', import.meta.url)).replace(
  /\/$/,
  '',
)
const exampleTypes = readFile(
  new URL('../../deno.check.d.ts', import.meta.url),
  'utf8',
).then((types) => types.replace("from './dist'", "from 'kysely'"))

// Keep compiler/highlighter initialization out of commands such as `serve`.
const require = createRequire(import.meta.url)
let highlighter
async function loadHighlighter() {
  const [
    { codeToHtml, getSingletonHighlighter },
    { createTransformerFactory, rendererRich },
    { createTwoslasher },
    { transformerMetaHighlight },
    { fromMarkdown },
    { gfmFromMarkdown },
    { defaultHandlers, toHast },
  ] = await Promise.all([
    import('shiki'),
    import('@shikijs/twoslash/core'),
    import('twoslash'),
    import('@shikijs/transformers'),
    import('mdast-util-from-markdown'),
    import('mdast-util-gfm'),
    import('mdast-util-to-hast'),
  ])

  await getSingletonHighlighter({
    langs: ['sql'],
    themes: ['light-plus', 'dark-plus'],
  })

  function renderMarkdown(markdown) {
    const mdast = fromMarkdown(
      markdown.replace(/\{@link\s+([^}|\s]+)[^}]*\}/g, '`$1`'),
      { mdastExtensions: [gfmFromMarkdown()] },
    )
    return toHast(mdast, {
      handlers: {
        code: (state, node) => {
          try {
            return this.codeToHast(node.value, {
              ...this.options,
              transformers: [],
              lang: node.lang || 'text',
            }).children[0]
          } catch {
            return defaultHandlers.code(state, node)
          }
        },
      },
    }).children
  }

  function renderMarkdownInline(markdown, context) {
    const children = renderMarkdown.call(
      this,
      context === 'tag:param'
        ? markdown.replace(/^([\w$-]+)/, '`$1` ')
        : markdown,
    )
    return children.length === 1 && children[0].tagName === 'p'
      ? children[0].children
      : children
  }
  const ts = require('typescript-6')
  // Twoslash needs the compiler API and standard library from TypeScript 6.
  const twoslash = createTransformerFactory(
    createTwoslasher({
      tsModule: ts,
      tsLibDirectory: dirname(require.resolve('typescript-6')),
      vfsRoot: root,
      compilerOptions: {
        strict: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowImportingTsExtensions: true,
        noEmit: true,
        paths: {
          kysely: [`${root}/src/index.ts`],
          'kysely/*': [`${root}/src/*`],
          '@kysely/kysely': [`${root}/src/index.ts`],
          'pg-pool': [`${root}/site/plugins/twoslash-types/pg-pool.d.ts`],
          'type-editor': [`${root}/type-editor.ts`],
        },
      },
    }),
    rendererRich({
      renderMarkdown,
      renderMarkdownInline,
      hast: {
        hoverCompose: ({ popup, token }) => [
          token,
          {
            type: 'element',
            tagName: 'template',
            properties: {},
            children: [],
            content: { type: 'root', children: [popup] },
          },
        ],
      },
    }),
  )()

  return { codeToHtml, twoslash, transformerMetaHighlight }
}

export async function highlightCode(
  code,
  { lang = 'text', meta = '', twoslash: hasTypes = false, collectPopup } = {},
) {
  const { codeToHtml, twoslash, transformerMetaHighlight } =
    await (highlighter ??= loadHighlighter())
  return codeToHtml(code, {
    lang,
    themes: { light: 'light-plus', dark: 'dark-plus' },
    defaultColor: false,
    meta: { __raw: meta },
    transformers: [
      transformerMetaHighlight(),
      {
        name: 'language-class',
        code(node) {
          this.addClassToHast(node, `language-${lang}`)
        },
      },
      ...(hasTypes
        ? [
            twoslash,
            {
              name: 'hoisted-type-popups',
              root(root) {
                const popups = []
                function visit(node) {
                  if (node.properties?.class?.includes('twoslash-hover')) {
                    node.properties.tabIndex = 0
                    const index = node.children.findIndex(
                      (child) => child.tagName === 'template',
                    )
                    if (index !== -1) {
                      const [template] = node.children.splice(index, 1)
                      const id = collectPopup
                        ? collectPopup(template.content)
                        : popups.push(template) - 1
                      template.properties['data-popup'] = id
                      node.properties['data-popup'] = id
                    }
                  }
                  node.children?.forEach(visit)
                }
                visit(root)
                if (!popups.length) return
                root.children.push({
                  type: 'element',
                  tagName: 'div',
                  properties: {
                    class: 'twoslash-popups',
                    hidden: true,
                    'data-markdown-ignore': true,
                    'data-pagefind-ignore': true,
                  },
                  children: popups,
                })
              },
            },
          ]
        : []),
    ],
  })
}

const component = 'KyselyShikiCodeBlock'

export default function remarkShiki() {
  return async (tree) => {
    let used = false

    async function highlight(parent) {
      for (let i = 0; i < (parent.children?.length ?? 0); i++) {
        const node = parent.children[i]
        if (node.type !== 'code' || node.lang === 'mermaid') {
          await highlight(node)
          continue
        }

        const meta = node.meta ?? ''
        const playground = /\bplayground\b/.test(meta)
        const html = await highlightCode(
          playground
            ? `// @filename: type-editor.ts\n${await exampleTypes}\n// @filename: index.ts\n// ---cut---\n${node.value}`
            : node.value,
          {
            lang: node.lang || 'text',
            meta,
            twoslash: /\btwoslash\b/.test(meta),
          },
        )

        parent.children[i] = {
          type: 'mdxJsxFlowElement',
          name: component,
          attributes: Object.entries({
            language: node.lang || 'text',
            children: node.value,
            highlightedHtml: html,
            title: /\btitle="([^"]*)"/.exec(meta)?.[1] ?? '',
            ...(playground ? { playground: 'true' } : {}),
          }).map(([name, value]) => ({ type: 'mdxJsxAttribute', name, value })),
          children: [],
        }
        used = true
      }
    }

    await highlight(tree)
    if (!used) return

    tree.children.unshift({
      type: 'mdxjsEsm',
      value: `import ${component} from '@theme/CodeBlock'`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ImportDeclaration',
              source: { type: 'Literal', value: '@theme/CodeBlock' },
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: { type: 'Identifier', name: component },
                },
              ],
            },
          ],
        },
      },
    })
  }
}
