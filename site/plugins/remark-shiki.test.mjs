import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
  assert.ok(!props.highlightedHtml.toLowerCase().includes('<script'))
})

test('examples resolve schema imports separately and expose accessible hovers', async () => {
  const code = `import type { Database } from 'type-editor'
import type { SqlBool } from 'kysely'
const rows = await db.selectFrom('person').select('id').execute()`
  const props = await render(code, 'twoslash playground')
  assert.equal(props.playground, 'true')
  assert.equal(props.children, code)
  assert.match(props.highlightedHtml, /twoslash-hover" tabindex="0"/)
  assert.doesNotMatch(
    props.highlightedHtml,
    /twoslash-popup-container|<template/,
  )
  assert.match(props.highlightedHtml, /data-popup="0"/)
  assert.match(props.popups, /^\/twoslash\/[0-9a-f]{16}\.json$/)
  const popups = JSON.parse(
    await readFile(
      new URL(
        `../node_modules/.cache${props.popups.replace('/twoslash', '/twoslash-popups')}`,
        import.meta.url,
      ),
      'utf8',
    ),
  )
  assert.ok(popups.some((popup) => popup.includes('twoslash-popup-docs')))
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

test('hidden Twoslash context stays out of the copied code', async () => {
  const props = await render(
    `import type { Kysely } from 'kysely'
declare const db: Kysely<any>
// ---cut---
await db.schema.dropTable('person').execute()`,
    'twoslash',
  )
  assert.equal(props.children, "await db.schema.dropTable('person').execute()")
  assert.doesNotMatch(props.highlightedHtml, /declare const db/)
})

test('expected errors render without leaking Twoslash directives', async () => {
  const props = await render(
    `import type { Kysely } from 'kysely'
declare const db: Kysely<{ person: { first_name: string } }>
// ---cut---
// @errors: 2339
const person = await db.selectFrom('person').select('first_name').executeTakeFirstOrThrow()
person.last_name`,
    'twoslash',
  )
  assert.doesNotMatch(props.children, /@errors/)
  assert.match(props.children, /^const person/)
  assert.match(props.highlightedHtml, /twoslash-error/)
  assert.match(props.highlightedHtml, /Property 'last_name' does not exist/)
})
