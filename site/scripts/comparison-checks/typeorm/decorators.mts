import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const legacy = process.execArgv.includes('--conditions=legacy')
const conditions = legacy ? ['--conditions=legacy'] : []

function node(args: string[]) {
  const result = spawnSync(process.execPath, [...conditions, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, TSX_TSCONFIG_PATH: 'decorators/tsconfig.json' },
  })
  return { status: result.status, output: result.stdout + result.stderr }
}

function tsc(compiler: string, args: string[]) {
  const bin = join(
    dirname(require.resolve(`${compiler}/package.json`)),
    'bin',
    'tsc',
  )
  return node([
    bin,
    ...args,
    ...(legacy ? ['--customConditions', 'legacy'] : []),
  ])
}

// TypeORM's getting started asks for both legacy decorator options and reflect-metadata.
// As standard decorators, its column decorators do not type-check.
for (const compiler of ['typescript', 'typescript-6']) {
  const standard = tsc(compiler, ['-p', 'decorators/tsconfig.standard.json'])
  assert.notEqual(standard.status, 0)
  assert.match(
    standard.output,
    /TS1240: Unable to resolve signature of property decorator/,
  )
}

// Node's built-in type stripping does not transform decorators.
const stripped = node(['decorators/decorated.ts'])
assert.notEqual(stripped.status, 0)
assert.match(stripped.output, /SyntaxError/)

// esbuild (through tsx) applies experimentalDecorators but emits no design:type
// metadata, so a column without an explicit type throws when the class is defined.
const tsx = require.resolve('tsx')
const esbuilt = node(['--import', tsx, 'decorators/decorated.ts'])
assert.notEqual(esbuilt.status, 0)
assert.match(
  esbuilt.output,
  /ColumnTypeUndefinedError: Column type for Person#id is not defined/,
)

// An explicit type on every column loads without metadata.
const explicit = node(['--import', tsx, 'decorators/explicit.ts'])
assert.equal(explicit.status, 0, explicit.output)

// tsc's own emit writes the metadata, on TypeScript 6 and 7.
const out = join(root, '.decorators-out')
try {
  for (const compiler of ['typescript', 'typescript-6']) {
    rmSync(out, { recursive: true, force: true })
    const emitted = tsc(compiler, [
      '-p',
      'decorators/tsconfig.json',
      '--outDir',
      out,
    ])
    assert.equal(emitted.status, 0, emitted.output)
    assert.match(
      readFileSync(join(out, 'decorated.js'), 'utf8'),
      /"design:type", Number/,
    )
    const ran = node([join(out, 'decorated.js')])
    assert.equal(ran.status, 0, ran.output)
  }
} finally {
  rmSync(out, { recursive: true, force: true })
}

// EntitySchema, as on the page, runs under Node's type stripping with no options.
const schema = node(['decorators/schema.ts'])
assert.equal(schema.status, 0, schema.output)
assert.match(schema.output, /id,first_name/)

// Kysely's Database interface is a type, erased by type stripping.
console.log(`decorators: TypeORM ${legacy ? '0.3.31' : '1.1.2'}`)
