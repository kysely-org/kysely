import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const docs = join(root, '..', '..', '..', 'docs', 'comparisons')
// Ignore indentation and formatting when matching the duplicated examples.
// Runtime assertions and compiler checks separately verify their behavior.
const normalize = (text) => text.replace(/\s+/g, '')
const blocks = (page) =>
  [
    ...readFileSync(join(docs, page), 'utf8').matchAll(
      /```(?:ts|sql)[^\n]*\n([\s\S]*?)\n```/g,
    ),
  ].map((match) => normalize(match[1]))

const examples = {
  'scenarios.mts': {
    'kysely-vs-prisma-7.mdx': [
      'prisma-leaderboard',
      'kysely-activity',
      'kysely-global-threshold',
      'kysely-per-author-threshold',
    ],
  },
  'raw-scenarios.mts': {
    'query-builder-vs-raw-sql-in-typescript.mdx': [
      'postgres-assets',
      'slonik-assets',
      'matching-assets',
      'kysely-listing',
    ],
    'query-builder-vs-sql-files.mdx': [
      'matching-assets',
      'kysely-listing',
      'kysely-count',
      'file-listing',
    ],
  },
}

let checked = 0
for (const [fixture, pages] of Object.entries(examples)) {
  const source = readFileSync(join(root, fixture), 'utf8')
  for (const [page, names] of Object.entries(pages)) {
    if (!existsSync(join(docs, page))) continue
    const pageBlocks = blocks(page)
    for (const name of names) {
      const start = `// DOC:${name}\n`
      const end = `// END:${name}`
      const code = source.split(start)[1]?.split(end)[0]
      assert(code, `${fixture}: missing ${name}`)
      assert(
        pageBlocks.includes(normalize(code)),
        `${page}: ${name} differs from its tested fixture`,
      )
      checked++
    }
  }
}
for (const name of existsSync(join(docs, 'query-builder-vs-sql-files.mdx'))
  ? ['findAssets', 'findAssetsWithTags', 'countAssets']
  : []) {
  const sql = readFileSync(join(root, 'sql', `${name}.sql`), 'utf8')
  assert(
    blocks('query-builder-vs-sql-files.mdx').includes(normalize(sql)),
    `${name}.sql differs from the page`,
  )
  checked++
}
console.log(
  `PASS: ${checked} documented functions and SQL files match the tested fixtures.`,
)
