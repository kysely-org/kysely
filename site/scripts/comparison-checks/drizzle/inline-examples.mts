import assert from 'node:assert/strict'
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript-6'

function declarations(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) declarations(path, out)
    else if (name.endsWith('.d.ts')) out.push(path)
  }
  return out
}

// Every JSDoc code block labeled `ts` in a package's published declarations,
// keyed by its text, with the declaration files that carry it.
function examples(pkg: string) {
  const root = realpathSync(join(import.meta.dirname, 'node_modules', pkg))
  const blocks = new Map<string, string[]>()
  for (const file of declarations(root)) {
    for (const comment of readFileSync(file, 'utf8').matchAll(
      /\/\*\*([\s\S]*?)\*\//g,
    )) {
      let code: string[] | undefined
      for (const raw of comment[1].split('\n')) {
        const line = raw.replace(/^\s*\* ?/, '')
        const fence = line.match(/^\s*```(\w*)\s*$/)
        if (!fence) code?.push(line)
        else if (code) {
          const text = code.join('\n').trim()
          if (text)
            blocks.set(text, [
              ...(blocks.get(text) ?? []),
              file.slice(root.length + 1),
            ])
          code = undefined
        } else if (fence[1] === 'ts') code = []
      }
    }
  }
  return blocks
}

function unparsable(blocks: Map<string, string[]>) {
  const failed: { files: string[]; code: string }[] = []
  for (const [code, files] of blocks) {
    const source = ts.createSourceFile(
      'example.ts',
      code,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    ) as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }
    if (source.parseDiagnostics.length > 0) failed.push({ files, code })
  }
  return failed
}

const kysely = examples('kysely')
const stable = examples('drizzle-stable')
const rc = examples('drizzle-rc')

// Kysely's examples are compiled in its CI; every one parses.
assert.ok(kysely.size > 400)
assert.deepEqual(unparsable(kysely), [])

// Drizzle 0.45.4: the one failure is an illustrative `...` placeholder.
const stableFailed = unparsable(stable)
assert.equal(stableFailed.length, 1)
assert.match(
  stableFailed[0].code,
  /function needsTable\(table: Table\) \{\s*\.\.\./,
)

// Drizzle 1.0.0-rc.5: the MSSQL delete and insert examples end the statement
// in the middle of the chain.
const rcFailed = unparsable(rc)
assert.equal(rcFailed.length, 3)
for (const [file, next] of [
  ['mssql-core/query-builders/delete.d.ts', '.where('],
  ['mssql-core/query-builders/insert.d.ts', '.values('],
] as const) {
  const broken = rcFailed.find((example) => example.files.includes(file))
  assert.ok(broken, `${file} example parses`)
  assert.match(broken.code, /\.output\(\);\n\s*\.(where|values)\(/)
  assert.ok(broken.code.includes(next))
}

console.log(
  `PASS: all ${kysely.size} TypeScript examples in Kysely's declarations parse; Drizzle stable has ${stable.size} with one placeholder that does not; Drizzle RC has ${rc.size}, and its MSSQL delete and insert examples do not parse`,
)
