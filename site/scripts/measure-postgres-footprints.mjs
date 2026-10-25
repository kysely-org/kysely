import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { gunzipSync } from 'node:zlib'

const exec = promisify(execFile)
const pg = '8.23.1'
const assumedPackages = new Set(['typescript'])
const setups = {
  kysely: {
    label: 'Kysely',
    version: '0.29.7',
    kind: 'builder',
    package: 'kysely',
    roots: { kysely: '0.29.7', 'kysely-ctl': '0.22.0', pg },
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
    roots: { 'drizzle-orm': '0.45.4', 'drizzle-kit': '0.31.11', pg },
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
    roots: { typeorm: '1.1.1', 'ts-node': '10.9.2', typescript: '6.0.3', pg },
  },
  sequelize: {
    label: 'Sequelize',
    version: '6.37.8',
    kind: 'framework',
    package: 'sequelize',
    roots: { sequelize: '6.37.8', 'sequelize-cli': '6.6.5', pg, 'pg-hstore': '2.3.4' },
  },
  mikroorm: {
    label: 'MikroORM',
    version: '7.2.5',
    kind: 'framework',
    package: '@mikro-orm/postgresql',
    roots: { '@mikro-orm/core': '7.2.5', '@mikro-orm/postgresql': '7.2.5', '@mikro-orm/cli': '7.2.5', '@mikro-orm/migrations': '7.2.5', jiti: '2.7.0', pg },
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
      '--ignore-scripts',
      '--omit=dev',
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
    await readFile(join(directory, 'node_modules', '.package-lock.json'), 'utf8'),
  )
  await rm(directory, { recursive: true, force: true })
  const placements = Object.entries(lock.packages)
    .filter(([path, pkg]) => path && !pkg.dev)
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
    `Resolved ${setup.label}: ${placements.length} installed dependency placements`,
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
  const excludedPlacements = setup.placements.filter((p) => assumedPackages.has(p.name))
  const countedPlacements = setup.placements.filter((p) => !assumedPackages.has(p.name))
  const versions = [
    ...new Set(countedPlacements.map((p) => `${p.name}@${p.version}`)),
  ].sort()
  return {
    ...setup,
    excludedPlacements,
    uniquePackages: versions.length,
    compressedBytes: versions.reduce(
      (sum, id) => sum + packages[id].compressedBytes,
      0,
    ),
    unpackedBytes: countedPlacements.reduce(
      (sum, p) => sum + packages[`${p.name}@${p.version}`].unpackedBytes,
      0,
    ),
    packageVersions: versions,
  }
})
const result = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  npm: (await exec('npm', ['--version'])).stdout.trim(),
  assumedPackages: [...assumedPackages],
  methodology:
    'Code-first PostgreSQL development setups support hand-authored schema/model definitions, migrations, querying, and mandatory code generation. Explicit roots include pg 8.23.1, kysely-ctl, Drizzle Kit, Prisma 7 CLI/client/adapter, MikroORM CLI/migrations/core/driver with jiti for TypeScript migration loading, TypeORM ts-node with its TypeScript peer, and Sequelize CLI/pg-hstore. Kysely includes its bundled schema/migration APIs plus kysely-ctl; Knex/TypeORM migration CLIs are bundled. Kysely database types are hand-authored; optional introspection, seeding, and extra generators are not added. TypeScript is assumed and excluded from package counts and both byte totals in every setup, even when required as a tool peer; excluded placements remain recorded. Shared Node.js and application type declarations are excluded unless pulled in by a tool. npm performs a real install with scripts disabled; the installed lockfile captures hard dependencies, required peers, and platform-compatible optional dependencies, including packaged native tool binaries. Tool roots are included regardless of whether an application would classify them as devDependencies. Unpacked sizes use npm metadata, or regular-file payloads from the tarball when metadata is missing. Compressed bytes sum each unique package version once. Unpacked bytes sum every installed placement, including duplicate copies. Sizes exclude filesystem overhead, generated application code, and install-script downloads. These are npm package payloads, not deployed application bundles or a total machine footprint.',
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
