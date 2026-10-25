import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

function installedPackage(name) {
  let path = dirname(require.resolve(name))
  for (;;) {
    try {
      const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))
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
  'drizzle-stable': '0.45.4',
  'drizzle-rc': '1.0.0-rc.5',
  typescript: '7.0.2',
  'typescript-6': '6.0.3',
})) {
  assert.equal(installedPackage(name).version, version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}

for (const compiler of ['typescript', 'typescript-6']) {
  run(`Strict type checks: ${compiler}`, [
    join(installedPackage(compiler).path, 'bin', 'tsc'),
    '-p',
    'tsconfig.json',
  ])
}

const fixtures = readdirSync(root)
  .filter((name) => name.endsWith('.mts'))
  .sort()
for (const fixture of fixtures) {
  run(fixture, ['--import', require.resolve('tsx'), fixture])
}

console.log(
  `\nPASS: ${fixtures.length} PostgreSQL fixture programs and both compiler versions.`,
)
