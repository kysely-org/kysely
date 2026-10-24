import assert from 'node:assert/strict'
import { test } from 'node:test'
import remarkShiki from './remark-shiki.mjs'

async function render(value, meta = '', lang = 'ts') {
  const tree = { children: [{ type: 'code', lang, meta, value }] }
  await remarkShiki()(tree)
  const node = tree.children.at(-1)
  return Object.fromEntries(
    node.attributes.map(({ name, value }) => [name, value]),
  )
}

test('build-time highlighting preserves copy text, titles, and line highlights', async () => {
  const code = 'const html = "<script>alert(1)</script>"'
  const props = await render(code, 'title="example.ts" {1}')
  assert.equal(props.children, code)
  assert.equal(props.title, 'example.ts')
  assert.match(props.highlightedHtml, /class="line highlighted"/)
  assert.match(props.highlightedHtml, /--shiki-light/)
  assert.match(props.highlightedHtml, /--shiki-dark/)
  assert.doesNotMatch(props.highlightedHtml, /<script>/)
})

test('examples resolve schema imports separately and expose accessible hovers', async () => {
  const code = `import type { Database } from 'type-editor'
import type { SqlBool } from 'kysely'
const rows = await db.selectFrom('person').select('id').execute()`
  const props = await render(code, 'twoslash playground')
  assert.equal(props.playground, 'true')
  assert.equal(props.children, code)
  assert.match(props.highlightedHtml, /twoslash-hover" tabindex="0"/)
  assert.match(props.highlightedHtml, /data-pagefind-ignore/)
  assert.doesNotMatch(
    props.highlightedHtml,
    /interface PersonTable|---cut---|@filename/,
  )
})

test('Twoslash validates types rather than silently emitting broken examples', async () => {
  await assert.rejects(
    render(
      'const rows = await db.selectFrom("missing_table").execute()',
      'twoslash playground',
    ),
    /Errors were thrown/,
  )
})

test('Mermaid remains available to the diagram renderer', async () => {
  const node = { type: 'code', lang: 'mermaid', value: 'graph TD; A-->B' }
  const tree = { children: [node] }
  await remarkShiki()(tree)
  assert.deepEqual(tree.children, [node])
})
