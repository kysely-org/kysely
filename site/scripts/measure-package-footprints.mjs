import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const packages = [
  ['kysely', '0.29.7'],
  ['knex', '3.3.0'],
  ['drizzle-orm', '0.45.4'],
  ['drizzle-orm', '1.0.0-rc.5'],
  ['@prisma/client', '7.10.1'],
  ['@prisma/adapter-pg', '7.10.1'],
  ['prisma', '7.10.1'],
  ['slonik', '49.11.0'],
  ['postgres', '3.4.9'],
  ['pg', '8.23.1'],
]
const stacks = {
  kysely: { kysely: '0.29.7', pg: '8.23.1' },
  knex: { knex: '3.3.0', pg: '8.23.1' },
  drizzleStable: { 'drizzle-orm': '0.45.4', pg: '8.23.1' },
  drizzleRc: { 'drizzle-orm': '1.0.0-rc.5', pg: '8.23.1' },
  prisma7: {
    '@prisma/client': '7.10.1',
    '@prisma/adapter-pg': '7.10.1',
    pg: '8.23.1',
  },
  slonik: { slonik: '49.11.0', pg: '8.23.1' },
  postgresJs: { postgres: '3.4.9' },
}

async function measurePackage([name, version]) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`,
  )
  if (!response.ok) throw new Error(`${name}: registry HTTP ${response.status}`)
  const manifest = await response.json()
  const tarball = await fetch(manifest.dist.tarball)
  if (!tarball.ok) throw new Error(`${name}: tarball HTTP ${tarball.status}`)
  return {
    name,
    version,
    tarballBytes: (await tarball.arrayBuffer()).byteLength,
    unpackedBytes: manifest.dist.unpackedSize,
    directDependencies: Object.keys(manifest.dependencies ?? {}).length,
    dependencies: manifest.dependencies ?? {},
    tarball: manifest.dist.tarball,
    integrity: manifest.dist.integrity,
  }
}

async function measureStack([name, dependencies]) {
  const directory = await mkdtemp(join(tmpdir(), `kysely-footprint-${name}-`))
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({ name: `measure-${name}`, private: true, dependencies }),
  )
  await exec(
    'npm',
    [
      'install',
      '--package-lock-only',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--omit=dev',
      '--omit=optional',
      '--no-audit',
      '--no-fund',
      '--loglevel=error',
    ],
    { cwd: directory, maxBuffer: 1024 * 1024 },
  )
  const lock = JSON.parse(
    await readFile(join(directory, 'package-lock.json'), 'utf8'),
  )
  const resolved = Object.entries(lock.packages)
    .filter(([path, pkg]) => path && !pkg.dev && !pkg.optional)
    .map(([path, pkg]) => {
      const packageName = pkg.name ?? path.split('node_modules/').at(-1)
      return `${packageName}@${pkg.version}`
    })
  const packageVersions = [...new Set(resolved)].sort()
  return [
    name,
    {
      roots: dependencies,
      uniquePackages: packageVersions.length,
      packageVersions,
    },
  ]
}

const report = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  npm: (await exec('npm', ['--version'])).stdout.trim(),
  methodology:
    'Package bytes are the gzip tarball body and npm dist.unpackedSize, excluding dependencies. PostgreSQL stacks count unique name@version production packages including the listed roots and explicit pg driver; optional dependencies and peer auto-installation are excluded. No install scripts run. Counts are not application bundle sizes.',
  packages: await Promise.all(packages.map(measurePackage)),
  stacks: {},
}

// Resolve in small batches to limit concurrent registry traffic.
const entries = Object.entries(stacks)
for (let offset = 0; offset < entries.length; offset += 2) {
  const measured = await Promise.all(
    entries.slice(offset, offset + 2).map(measureStack),
  )
  Object.assign(report.stacks, Object.fromEntries(measured))
}

const output = process.argv[2]
const json = JSON.stringify(report, null, 2) + '\n'
if (output) await writeFile(output, json)
else process.stdout.write(json)

if (output) {
  console.log(`Wrote ${output}`)
  for (const pkg of report.packages) {
    console.log(
      `${pkg.name}@${pkg.version}: ${pkg.tarballBytes} compressed bytes, ${pkg.unpackedBytes} unpacked bytes, ${pkg.directDependencies} direct dependencies`,
    )
  }
  for (const [name, stack] of Object.entries(report.stacks)) {
    console.log(`${name}: ${stack.uniquePackages} production packages`)
  }
}
