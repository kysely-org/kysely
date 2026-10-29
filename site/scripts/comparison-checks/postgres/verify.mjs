import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
assert(
  process.env.COMPARISON_DATABASE_URL,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server; the test user needs CREATE DATABASE privileges.',
)

// Packages whose entry points are not resolvable from their bare names.
// @pgtyped/cli only exports ESM subpaths, so it needs the import resolver.
const entryPoints = {
  prisma: () => require.resolve('prisma/config'),
  '@pgtyped/cli': () =>
    fileURLToPath(import.meta.resolve('@pgtyped/cli/lib/index.js')),
}

function installedPackage(name) {
  let path = dirname((entryPoints[name] ?? (() => require.resolve(name)))())
  for (;;) {
    try {
      const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))
      if (typeof pkg.version !== 'string') throw new Error('Not a package root')
      return { path, version: pkg.version }
    } catch {
      const parent = dirname(path)
      if (parent === path)
        throw new Error(`Cannot find package.json for ${name}`)
      path = parent
    }
  }
}

function run(label, args, command = process.execPath) {
  console.log(`\n${label}`)
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      RAW_COMPARISON_DATABASE_URL: process.env.COMPARISON_DATABASE_URL,
    },
  })
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${label} failed`)
}

for (const [name, version] of Object.entries({
  kysely: '0.29.7',
  knex: '3.3.0',
  '@prisma/client': '7.10.1',
  '@prisma/adapter-pg': '7.10.1',
  prisma: '7.10.1',
  postgres: '3.4.9',
  slonik: '49.11.0',
  '@slonik/pg-driver': '49.11.0',
  pg: '8.23.1',
  '@pgtyped/cli': '2.4.3',
  '@pgtyped/runtime': '2.4.2',
  typescript: '7.0.2',
  'typescript-6': '6.0.3',
})) {
  assert.equal(installedPackage(name).version, version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}

// sqlc is a Go binary (`brew install sqlc`); its TypeScript plugin is a wasm
// module pinned by URL and sha256 in sqlc/sqlc.yaml and downloaded on first use.
const sqlc = spawnSync('sqlc', ['version'], { encoding: 'utf8' })
assert.equal(
  sqlc.error ? undefined : sqlc.stdout.trim(),
  'v1.31.1',
  'sqlc version drift; install with `brew install sqlc`',
)
console.log(`sqlc: ${sqlc.stdout.trim()}`)

run('Documented example parity', [join(root, 'check-docs.mjs')])

run('Generate the Prisma model client', [
  join(installedPackage('prisma').path, 'build', 'index.js'),
  'generate',
  '--schema',
  'schema.prisma',
])

// sqlc parses the schema and query files itself; no database is involved.
run(
  'Generate sqlc query functions',
  ['generate', '-f', 'sqlc/sqlc.yaml'],
  'sqlc',
)

run('Knex compilation and built-in alternatives', [
  '--import',
  require.resolve('tsx'),
  'knex-semantics.mts',
])
run('Prisma and Knex PostgreSQL scenarios', [
  '--import',
  require.resolve('tsx'),
  'scenarios.mts',
])
// This program creates a disposable database, generates TypedSQL and PgTyped
// output against its tables, checks all six clients, then drops the database.
run('Raw SQL and generated SQL-file scenarios', [
  '--import',
  require.resolve('tsx'),
  'raw-scenarios.mts',
])

for (const compiler of ['typescript', 'typescript-6']) {
  run(`Strict type checks: ${compiler}`, [
    join(installedPackage(compiler).path, 'bin', 'tsc'),
    '-p',
    'tsconfig.json',
  ])
}
console.log(
  '\nPASS: Prisma, Knex, Postgres.js, Slonik, and generated TypedSQL, PgTyped, and sqlc comparisons; both compiler versions.',
)
