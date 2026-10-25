import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { gunzipSync } from 'node:zlib'

const exec = promisify(execFile)
const pg = '8.23.1'
const setups = {
  kysely: {
    label: 'Kysely',
    version: '0.29.7',
    kind: 'builder',
    package: 'kysely',
    roots: { kysely: '0.29.7', pg },
  },
  knex: {
    label: 'Knex',
    version: '3.3.0',
    kind: 'builder',
    package: 'knex',
    roots: { knex: '3.3.0', pg },
  },
  drizzle: {
    label: 'Drizzle',
    version: '0.45.4',
    kind: 'framework',
    package: 'drizzle-orm',
    roots: { 'drizzle-orm': '0.45.4', pg },
  },
  prisma: {
    label: 'Prisma',
    version: '7.10.1',
    kind: 'framework',
    package: '@prisma/client',
    roots: {
      '@prisma/client': '7.10.1',
      '@prisma/adapter-pg': '7.10.1',
      prisma: '7.10.1',
      pg,
    },
  },
  typeorm: {
    label: 'TypeORM',
    version: '1.1.1',
    kind: 'framework',
    package: 'typeorm',
    roots: { typeorm: '1.1.1', pg },
  },
  sequelize: {
    label: 'Sequelize',
    version: '6.37.8',
    kind: 'framework',
    package: 'sequelize',
    roots: { sequelize: '6.37.8', pg, 'pg-hstore': '2.3.4' },
  },
  mikroorm: {
    label: 'MikroORM',
    version: '7.2.5',
    kind: 'framework',
    package: '@mikro-orm/postgresql',
    roots: { '@mikro-orm/core': '7.2.5', '@mikro-orm/postgresql': '7.2.5', pg },
  },
}

async function resolveSetup([id, setup]) {
  const directory = await mkdtemp(join(tmpdir(), `kysely-pg-size-${id}-`))
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({
      name: `measure-${id}`,
      private: true,
      dependencies: setup.roots,
    }),
  )
  await exec(
    'npm',
    [
      'install',
      '--package-lock-only',
      '--ignore-scripts',
      '--omit=dev',
      '--omit=optional',
      '--workspaces=false',
      '--no-audit',
      '--no-fund',
      '--loglevel=error',
      '--fetch-retries=1',
      '--fetch-timeout=30000',
    ],
    { cwd: directory, maxBuffer: 8 * 1024 ** 2 },
  )
  const lock = JSON.parse(
    await readFile(join(directory, 'package-lock.json'), 'utf8'),
  )
  const placements = Object.entries(lock.packages)
    .filter(([path, pkg]) => path && !pkg.dev && !pkg.optional)
    .map(([path, pkg]) => ({
      path,
      name: pkg.name ?? path.split('node_modules/').at(-1),
      version: pkg.version,
    }))
  assert(
    placements.some((p) => p.name === 'pg' && p.version === pg),
    `${id}: missing pinned node-postgres`,
  )
  assert(
    placements.filter((p) => p.name === 'pg').every((p) => p.version === pg),
    `${id}: inconsistent node-postgres versions`,
  )
  if (id === 'prisma')
    assert(
      placements.some((p) => p.name === 'prisma'),
      'Prisma CLI must be included',
    )
  if (id === 'mikroorm') {
    assert(
      placements.some((p) => p.name === '@mikro-orm/sql'),
      'MikroORM SQL layer must be included',
    )
    assert(
      placements.some((p) => p.name === 'kysely'),
      'MikroORM must include its Kysely dependency',
    )
  }
  console.log(
    `Resolved ${setup.label}: ${placements.length} hard-dependency placements`,
  )
  return { id, ...setup, placements }
}

const cache = join(tmpdir(), 'kysely-pg-footprint-cache')
await mkdir(cache, { recursive: true })
function archiveFileBytes(compressed) {
  const tar = gunzipSync(compressed)
  let total = 0
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break
    const size = Number.parseInt(
      header.subarray(124, 136).toString('ascii').replaceAll('\0', '').trim() ||
        '0',
      8,
    )
    assert(
      Number.isSafeInteger(size) &&
        size >= 0 &&
        offset + 512 + size <= tar.length,
      'Invalid tar entry size',
    )
    if (header[156] === 0 || header[156] === 48) total += size
    offset += 512 + Math.ceil(size / 512) * 512
  }
  return total
}

async function measurePackage({ name, version }) {
  const file = join(cache, `${encodeURIComponent(name)}@${version}.json`)
  try {
    const record = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(record.name, name)
    assert.equal(record.version, version)
    return record
  } catch {}
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`,
    { signal: AbortSignal.timeout(30000) },
  )
  assert(response.ok, `${name}@${version}: registry HTTP ${response.status}`)
  const manifest = await response.json()
  const responseTarball = await fetch(manifest.dist.tarball, {
    signal: AbortSignal.timeout(30000),
  })
  assert(
    responseTarball.ok,
    `${name}@${version}: tarball HTTP ${responseTarball.status}`,
  )
  const tarball = Buffer.from(await responseTarball.arrayBuffer())
  if (manifest.dist.integrity?.startsWith('sha512-')) {
    assert.equal(
      `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
      manifest.dist.integrity,
      `${name}@${version}: integrity mismatch`,
    )
  } else {
    assert.equal(
      createHash('sha1').update(tarball).digest('hex'),
      manifest.dist.shasum,
    )
  }
  const unpackedBytes = manifest.dist.unpackedSize ?? archiveFileBytes(tarball)
  const record = {
    name,
    version,
    compressedBytes: tarball.byteLength,
    unpackedBytes,
    tarball: manifest.dist.tarball,
    integrity: manifest.dist.integrity ?? manifest.dist.shasum,
  }
  await writeFile(file, JSON.stringify(record))
  return record
}

const resolved = []
const entries = Object.entries(setups)
for (let i = 0; i < entries.length; i += 2)
  resolved.push(
    ...(await Promise.all(entries.slice(i, i + 2).map(resolveSetup))),
  )
const unique = new Map()
for (const setup of resolved)
  for (const entry of setup.placements)
    unique.set(`${entry.name}@${entry.version}`, entry)
const packages = {}
const all = [...unique.entries()]
for (let i = 0; i < all.length; i += 6) {
  const measured = await Promise.all(
    all
      .slice(i, i + 6)
      .map(async ([id, entry]) => [id, await measurePackage(entry)]),
  )
  Object.assign(packages, Object.fromEntries(measured))
  console.log(
    `Measured ${Math.min(i + 6, all.length)}/${all.length} unique package versions`,
  )
}
const stacks = resolved.map((setup) => {
  const versions = [
    ...new Set(setup.placements.map((p) => `${p.name}@${p.version}`)),
  ].sort()
  return {
    ...setup,
    uniquePackages: versions.length,
    compressedBytes: versions.reduce(
      (sum, id) => sum + packages[id].compressedBytes,
      0,
    ),
    unpackedBytes: setup.placements.reduce(
      (sum, p) => sum + packages[`${p.name}@${p.version}`].unpackedBytes,
      0,
    ),
    packageVersions: versions,
  }
})
const result = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  npm: (await exec('npm', ['--version'])).stdout.trim(),
  methodology:
    'Each PostgreSQL setup includes explicit roots, pg 8.23.1, and all hard production dependencies resolved by npm. Prisma includes its CLI, client, and PostgreSQL adapter; MikroORM includes its core and PostgreSQL driver; Sequelize includes pg-hstore. Required peers are resolved by npm; optional and dev dependencies are excluded. Unpacked sizes use npm metadata, or regular-file payloads from the tarball when older releases omit that metadata. Compressed bytes sum each unique package version once. Unpacked bytes sum package contents for every lockfile placement, including duplicate copies. Sizes exclude filesystem overhead, generated application code, and downloads performed by install scripts. These are npm package payloads, not application bundles or timing benchmarks.',
  stacks,
  packages,
}
const output = process.argv[2]
if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n')
else process.stdout.write(JSON.stringify(result, null, 2) + '\n')
for (const s of stacks)
  console.log(
    `${s.label}: ${(s.compressedBytes / 1024 ** 2).toFixed(2)} MiB compressed, ${(s.unpackedBytes / 1024 ** 2).toFixed(2)} MiB unpacked, ${s.uniquePackages} unique packages`,
  )
