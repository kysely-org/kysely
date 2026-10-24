import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = ['scenarios.mts', 'v7-sql.mts']
  .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
  .join('\n')
const page = readFileSync(
  new URL('../../../docs/comparisons/kysely-vs-sequelize.mdx', import.meta.url),
  'utf8',
)
const normalize = (text) => text.replace(/\s+/g, ' ').trim()
const examples = [
  ...page.matchAll(
    /\{\/\* fixture: ([\w-]+) \*\/\}\s*```ts[^\n]*\n([\s\S]*?)```/g,
  ),
]
assert(examples.length >= 12, 'Missing documented fixture examples')
for (const [, name, code] of examples) {
  const start = source.indexOf(`// DOC:${name}\n`)
  const end = source.indexOf(`// END:${name}`, start)
  assert(start >= 0 && end > start, `Unknown fixture: ${name}`)
  const fixture = source.slice(start + `// DOC:${name}\n`.length, end)
  assert.equal(
    normalize(code),
    normalize(fixture),
    `Documented example drift: ${name}`,
  )
}
console.log(
  `PASS: ${examples.length} documented examples match the tested fixtures.`,
)
