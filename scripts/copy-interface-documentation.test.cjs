const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript-6')
const {
  copyInterfaceDocumentation,
} = require('./util/copy-interface-documentation.cjs')

function fixture(t, files) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'kysely-interface-docs-'),
  )
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  for (const [name, source] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true })
    fs.writeFileSync(path.join(directory, name), source)
  }
  return directory
}

function comment(directory, file, object, member, index = 0) {
  const name = path.join(directory, file)
  const source = ts.createSourceFile(
    name,
    fs.readFileSync(name, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const declaration = source.statements.find(
    (node) => node.name?.text === object,
  )
  const node = declaration.members.filter((node) => node.name?.text === member)[
    index
  ]
  return node.jsDoc?.map((doc) => doc.getText(source)).join('\n') ?? ''
}

for (const extension of ['ts', 'd.ts']) {
  test(`composes descriptions and local examples in .${extension} files`, (t) => {
    const directory = fixture(t, {
      [`base.${extension}`]: `export interface Shared {
  /**
   * Shared execution description.
   *
   * No implicit row limit.
   *
   * ### Examples
   *
   * \`\`\`ts
   * selectExample()
   * \`\`\`
   *
   * @returns The first result.
   */
  execute(): unknown
}`,
      [`child.${extension}`]: `import type { Shared as Base } from './base.js'
export interface Intermediate extends Base {}
export class Child implements Intermediate {
  /**
   * @remarks
   * Write-specific result behavior.
   *
   * ### Examples
   *
   * \`\`\`ts
   * updateExample()
   * \`\`\`
   *
   * The generated SQL (PostgreSQL):
   *
   * \`\`\`sql
   * update "person" set "name" = $1
   * \`\`\`
   */
  execute(): unknown${extension === 'ts' ? ' { return undefined }' : ''}
}`,
    })
    copyInterfaceDocumentation(directory)
    const doc = comment(directory, `child.${extension}`, 'Child', 'execute')
    assert.equal(doc.match(/Shared execution description/g)?.length, 1)
    assert.equal(doc.match(/No implicit row limit/g)?.length, 1)
    assert.ok(
      doc.indexOf('Shared execution description') <
        doc.indexOf('Write-specific result behavior'),
    )
    assert.match(doc, /updateExample/)
    assert.match(doc, /```sql/)
    assert.doesNotMatch(doc, /selectExample|@remarks/)
    assert.match(doc, /@returns The first result/)
    const before = fs.readFileSync(
      path.join(directory, `child.${extension}`),
      'utf8',
    )
    copyInterfaceDocumentation(directory)
    assert.equal(
      fs.readFileSync(path.join(directory, `child.${extension}`), 'utf8'),
      before,
    )
  })
}

test('preserves authored summaries and documents each overload only once', (t) => {
  const directory = fixture(t, {
    'index.ts': `interface Base {
  /** Shared summary. */
  execute(value: unknown): unknown
}
class Inherited implements Base {
  execute(value: number): number
  execute(value: string): string
  execute(value: unknown): unknown { return value }
}
class Replacement implements Base {
  /** Custom replacement summary. */
  execute(value: unknown): unknown { return value }
}`,
  })
  copyInterfaceDocumentation(directory)
  assert.match(
    comment(directory, 'index.ts', 'Inherited', 'execute'),
    /Shared summary/,
  )
  assert.equal(comment(directory, 'index.ts', 'Inherited', 'execute', 1), '')
  assert.doesNotMatch(
    comment(directory, 'index.ts', 'Replacement', 'execute'),
    /Shared summary/,
  )
  const before = fs.readFileSync(path.join(directory, 'index.ts'), 'utf8')
  copyInterfaceDocumentation(directory)
  assert.equal(
    fs.readFileSync(path.join(directory, 'index.ts'), 'utf8'),
    before,
  )
})

test('keeps inherited examples after remarks when no local examples are provided', (t) => {
  const directory = fixture(t, {
    'index.ts': `interface Base {
  /**
   * Shared summary.
   *
   * ### Examples
   * inheritedExample()
   */
  execute(): void
}
class Child implements Base {
  /** @remarks Additional behavior. */
  execute(): void {}
}`,
  })
  copyInterfaceDocumentation(directory)
  const doc = comment(directory, 'index.ts', 'Child', 'execute')
  assert.ok(doc.indexOf('Additional behavior') < doc.indexOf('### Examples'))
  assert.match(doc, /inheritedExample/)
})

test('resolves same-named interfaces through their imports and terminates cycles', (t) => {
  const directory = fixture(t, {
    'one.ts':
      'export interface Base {\n  /** First definition. */\n  execute(): void\n}',
    'two.ts':
      'export interface Base {\n  /** Second definition. */\n  execute(): void\n}',
    'child.ts': `import type { Base } from './two.js'
class Child implements Base {
  execute(): void {}
}
interface A extends B {}
interface B extends A {}
class Circular implements A { execute(): void {} }`,
  })
  copyInterfaceDocumentation(directory)
  assert.match(
    comment(directory, 'child.ts', 'Child', 'execute'),
    /Second definition/,
  )
  assert.equal(comment(directory, 'child.ts', 'Circular', 'execute'), '')
})

test('maps generated member lines back to authored source lines', (t) => {
  const input = `interface Base {
  /**
   * Shared description.
   *
   * A second paragraph.
   */
  execute(): void
}
class Child implements Base {
  /** @remarks Local detail. */
  execute(): void {}
}
`
  const directory = fixture(t, { 'index.ts': input })
  const mappings = copyInterfaceDocumentation(directory)['index.ts']
  const output = fs.readFileSync(path.join(directory, 'index.ts'), 'utf8')
  const originalLine = input
    .slice(0, input.lastIndexOf('  execute()'))
    .split('\n').length
  const generatedLine = output
    .slice(0, output.lastIndexOf('  execute()'))
    .split('\n').length
  const applicable = mappings.filter(([line]) => line <= generatedLine).at(-1)
  assert.equal(generatedLine - applicable[1], originalLine)
})
