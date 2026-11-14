import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
assert(
  process.env.COMPARISON_DATABASE_URL,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server; the user needs CREATE SCHEMA.',
)

function installedPackage(name) {
  let path = dirname(require.resolve(name))
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

function run(label, args) {
  console.log(`\n${label}`)
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${label} failed`)
}

for (const [name, version] of Object.entries({
  kysely: '0.29.8',
  'typeorm-current': '1.1.2',
  'typeorm-legacy': '0.3.31',
  pg: '8.23.1',
  'pg-query-stream': '4.17.1',
  typescript: '7.0.2',
  'typescript-6': '6.0.3',
})) {
  assert.equal(installedPackage(name).version, version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}

for (const config of ['tsconfig.json', 'tsconfig.legacy.json']) {
  for (const compiler of ['typescript', 'typescript-6']) {
    run(`Strict type checks: ${config}, ${compiler}`, [
      join(installedPackage(compiler).path, 'bin', 'tsc'),
      '-p',
      config,
    ])
  }
}

const fixtures = readdirSync(root)
  .filter((name) => name.endsWith('.mts') && !name.startsWith('_'))
  .sort()
for (const fixture of fixtures) {
  run(`${fixture} on TypeORM 1.1.2`, ['--import', require.resolve('tsx'), fixture])
  run(`${fixture} on TypeORM 0.3.31`, [
    '--conditions=legacy',
    '--import',
    require.resolve('tsx'),
    fixture,
  ])
}

console.log(
  `\nPASS: ${fixtures.length} PostgreSQL fixture programs on both TypeORM releases, and both compiler versions.`,
)
