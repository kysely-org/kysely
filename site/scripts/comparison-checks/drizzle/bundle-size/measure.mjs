import assert from 'node:assert/strict'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
process.chdir(root)

function installedVersion(name) {
  const path = join(root, 'node_modules', name, 'package.json')
  return JSON.parse(readFileSync(path, 'utf8')).version
}

for (const [name, version] of Object.entries({
  kysely: '0.29.8',
  'drizzle-stable': '0.45.4',
  'drizzle-rc': '1.0.0-rc.5',
  pg: '8.23.1',
  vite: '8.3.6',
  rolldown: '1.2.16',
})) {
  assert.equal(installedVersion(name), version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}

const expected = {
  kysely: { label: 'Kysely 0.29.8', minified: 160_040, gzip: 30_903 },
  'drizzle-stable': { label: 'Drizzle 0.45.4', minified: 81_463, gzip: 20_548 },
  'drizzle-rc': {
    label: 'Drizzle 1.0.0-rc.5',
    minified: 140_333,
    gzip: 37_278,
  },
}

const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`
const bundles = {}

console.log('')
for (const [name, { label, minified, gzip }] of Object.entries(expected)) {
  const outDir = join('dist', name)
  rmSync(outDir, { recursive: true, force: true })

  await build({
    configFile: false,
    logLevel: 'error',
    build: {
      ssr: `src/${name}.ts`,
      outDir,
      minify: true,
      rollupOptions: { external: ['pg'] },
    },
    ssr: { noExternal: true, external: ['pg'] },
  })

  const files = readdirSync(outDir, { recursive: true })
  assert.deepEqual(files, [`${name}.js`], `${name}: expected a single chunk`)

  const path = join(root, outDir, `${name}.js`)
  const code = readFileSync(path)
  const gzipped = gzipSync(code, { level: 9 }).length
  console.log(
    `${label.padEnd(20)} ${kib(code.length)} minified, ${kib(gzipped)} gzip`,
  )

  assert.equal(code.length, minified, `${label}: minified size changed`)
  assert.ok(
    Math.abs(gzipped - gzip) <= gzip * 0.01,
    `${label}: gzip size changed, got ${gzipped}`,
  )
  bundles[name] = path
}

const databaseUrl = process.env.COMPARISON_DATABASE_URL
if (!databaseUrl) {
  console.log(
    '\nPASS: bundle sizes. Set COMPARISON_DATABASE_URL to also run the bundles.',
  )
  process.exit(0)
}

const { default: pg } = await import('pg')
const schema = 'bundle_size_check'
const admin = new pg.Client({ connectionString: databaseUrl })
await admin.connect()
await admin.query(`drop schema if exists ${schema} cascade`)
await admin.query(`create schema ${schema}`)
await admin.query(
  `create table ${schema}.person (id integer not null, first_name text not null, age integer)`,
)
await admin.query(
  `insert into ${schema}.person values (1, 'Jennifer', 54), (2, 'Arnold', null)`,
)

const url = new URL(databaseUrl)
url.searchParams.set('options', `-c search_path=${schema}`)
process.env.DATABASE_URL = url.href

try {
  for (const [name, path] of Object.entries(bundles)) {
    const bundle = await import(pathToFileURL(path).href)
    assert.deepEqual(await bundle.listPeople(), [
      { id: 1, first_name: 'Jennifer', age: 54 },
      { id: 2, first_name: 'Arnold', age: null },
    ])
    await bundle.close()
  }
} finally {
  await admin.query(`drop schema ${schema} cascade`)
  await admin.end()
}

console.log('\nPASS: bundle sizes, and all three bundles return the same rows.')
