import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
assert(
  process.env.COMPARISON_DATABASE_URL,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL database; the test user needs CREATE SCHEMA privileges.',
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
  kysely: '0.29.7',
  sequelize: '6.37.8',
  '@sequelize/core': '7.0.0-alpha.48',
  '@sequelize/postgres': '7.0.0-alpha.48',
  pg: '8.23.1',
  typescript: '7.0.2',
  'typescript-6': '6.0.3',
})) {
  assert.equal(installedPackage(name).version, version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}
run('Documented example parity', ['check-docs.mjs'])
for (const config of ['tsconfig.json', 'tsconfig.v7.json']) {
  for (const compiler of ['typescript', 'typescript-6']) {
    run(`Strict types: ${config}, ${compiler}`, [
      join(installedPackage(compiler).path, 'bin', 'tsc'),
      '-p',
      config,
    ])
  }
}
run('Sequelize 6 PostgreSQL results', [
  '--import',
  require.resolve('tsx'),
  'scenarios.mts',
])
run('Sequelize 7 alpha PostgreSQL results', [
  '--conditions=sequelize7',
  '--import',
  require.resolve('tsx'),
  'scenarios.mts',
])
run('Sequelize 7 SQL tag and explicit raw result typing', [
  '--import',
  require.resolve('tsx'),
  'v7-sql.mts',
])
console.log(
  '\nPASS: both Sequelize releases, both compiler versions, SQL tag, PostgreSQL results, and documented examples.',
)
