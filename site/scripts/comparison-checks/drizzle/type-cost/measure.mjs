import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { availableParallelism } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  caseDirectory,
  cases,
  generate,
  libraries,
  queries,
  tableCounts,
} from './generate.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const update = process.argv.includes('--update')
const timed = process.argv.includes('--time')
const expectedPath = join(root, 'expected.json')

function installed(name) {
  let path = dirname(require.resolve(name))
  while (!existsSync(join(path, 'package.json'))) path = dirname(path)
  const { version } = JSON.parse(
    readFileSync(join(path, 'package.json'), 'utf8'),
  )
  return { path, version }
}

for (const [name, version] of Object.entries({
  kysely: '0.29.8',
  'kysely-next': '0.30.0-beta.2',
  'drizzle-stable': '0.45.4',
  'drizzle-rc': '1.0.0-rc.5',
  typescript: '7.0.2',
  'typescript-6': '6.0.3',
})) {
  assert.equal(installed(name).version, version, `${name} version drift`)
  console.log(`${name}: ${version}`)
}

// TypeScript 7 checks files on several checkers, each with its own cache, so
// its default count repeats first-use work per checker and depends on how the
// files are split. Single-threaded, it counts the work once, as TypeScript 6
// does. Check time is measured in the default mode.
const tsc7 = join(installed('typescript').path, 'bin', 'tsc')
const compilers = {
  'TypeScript 7.0.2, single-threaded': [tsc7, '--singleThreaded'],
  'TypeScript 6.0.3': [join(installed('typescript-6').path, 'bin', 'tsc')],
}
const timedCompilers = {
  'TypeScript 7.0.2': [tsc7],
  'TypeScript 6.0.3': compilers['TypeScript 6.0.3'],
}

function check(
  compiler,
  library,
  tableCount,
  name,
  command = compilers[compiler],
) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [
        ...command,
        '-p',
        join(caseDirectory(library, tableCount), `tsconfig.${name}.json`),
        '--extendedDiagnostics',
      ],
      { maxBuffer: 1 << 26 },
      (error, stdout) => {
        const label = `${compiler}, ${library}, ${tableCount} tables, ${name}`
        // A case that does not type-check is not a measurement.
        if (error) return reject(new Error(`${label}\n${stdout}`))
        const instantiations = /^Instantiations:\s+(\d+)/m.exec(stdout)
        const checkTime = /^Check time:\s+([\d.]+)s/m.exec(stdout)
        if (!instantiations || !checkTime) {
          return reject(new Error(`${label}: no diagnostics\n${stdout}`))
        }
        resolve({
          instantiations: Number(instantiations[1]),
          checkTime: Number(checkTime[1]),
        })
      },
    )
  })
}

generate()

const jobs = []
for (const compiler of Object.keys(compilers))
  for (const library of Object.keys(libraries))
    for (const tableCount of tableCounts)
      for (const name of cases)
        jobs.push({ compiler, library, tableCount, name })

const measured = {}
let next = 0
async function worker() {
  while (next < jobs.length) {
    const { compiler, library, tableCount, name } = jobs[next++]
    const { instantiations } = await check(compiler, library, tableCount, name)
    ;(((measured[compiler] ??= {})[library] ??= {})[tableCount] ??= {})[name] =
      instantiations
  }
}
await Promise.all(
  Array.from({ length: Math.max(1, availableParallelism() - 2) }, worker),
)

// Sort keys so the file does not depend on which job finished first.
const ordered = {}
for (const compiler of Object.keys(compilers)) {
  ordered[compiler] = {}
  for (const library of Object.keys(libraries)) {
    ordered[compiler][library] = {}
    for (const tableCount of tableCounts) {
      ordered[compiler][library][tableCount] = Object.fromEntries(
        cases.map((name) => [
          name,
          measured[compiler][library][tableCount][name],
        ]),
      )
    }
  }
}

const number = (value) => value.toLocaleString('en-US')
const row = (cells) => `| ${cells.join(' | ')} |`

function table(title, head, lines) {
  console.log(`\n${title}\n`)
  console.log(row(head))
  console.log(row(head.map(() => '---')))
  for (const line of lines) console.log(row(line))
}

for (const compiler of Object.keys(compilers)) {
  const of = (library, tableCount, name) =>
    ordered[compiler][library][tableCount][name]
  const labels = Object.values(libraries).map(({ label }) => label)
  const names = Object.keys(libraries)

  table(
    `${compiler}: instantiations before any query (library, client, and schema)`,
    ['Tables', ...labels],
    tableCounts.map((tableCount) => [
      number(tableCount),
      ...names.map((library) => number(of(library, tableCount, 'baseline'))),
    ]),
  )
  for (const tableCount of tableCounts) {
    const added = (name, to) =>
      names.map((library) =>
        number(of(library, tableCount, name) - of(library, tableCount, to)),
      )
    table(
      `${compiler}: instantiations added, ${number(tableCount)} tables`,
      ['Added to the program', ...labels],
      [
        ['The ten queries, first time', ...added('all', 'baseline')],
        ['The ten again, on other tables', ...added('all-twice', 'all')],
        ...queries.map((query) => [
          `One more: ${query}`,
          ...added(`all-plus-${query}`, 'all'),
        ]),
      ],
    )
  }
}

if (update) {
  writeFileSync(expectedPath, `${JSON.stringify(ordered, null, 2)}\n`)
  console.log(`\nWrote ${expectedPath}`)
} else {
  assert.deepEqual(
    ordered,
    JSON.parse(readFileSync(expectedPath, 'utf8')),
    'instantiation counts changed; rerun with --update and review the diff',
  )
  console.log(
    `\nPASS: ${jobs.length} programs type-check and match the recorded instantiation counts.`,
  )
}

if (timed) {
  // Check time depends on the machine. It is printed, never asserted.
  const runs = 5
  for (const compiler of Object.keys(timedCompilers)) {
    const lines = []
    for (const tableCount of tableCounts) {
      for (const name of ['baseline', 'all', 'all-twice']) {
        const cells = []
        for (const library of Object.keys(libraries)) {
          const times = []
          for (let i = 0; i < runs; i++) {
            times.push(
              (
                await check(
                  compiler,
                  library,
                  tableCount,
                  name,
                  timedCompilers[compiler],
                )
              ).checkTime,
            )
          }
          times.sort((a, b) => a - b)
          cells.push(`${times[Math.floor(runs / 2)].toFixed(2)}s`)
        }
        lines.push([number(tableCount), name, ...cells])
      }
    }
    table(
      `${compiler}: check time, median of ${runs} runs on this machine`,
      ['Tables', 'Program', ...Object.values(libraries).map((l) => l.label)],
      lines,
    )
  }
}
