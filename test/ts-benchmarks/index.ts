import { spawn } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ALL_FILES = await readdir(__dirname)

const BENCH_FILES = ALL_FILES.filter((filename) =>
  filename.endsWith('.bench.ts'),
)

let completed = 0
const COUNT = BENCH_FILES.length

async function runInSubprocess(
  benchFile: string,
): Promise<{ exitCode: number; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const proc = spawn('node', ['--experimental-strip-types', benchFile], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stderr, stdout })
    })
  })
}

interface BenchResult {
  exitCode: number
  filename: string
  stderr: string
  stdout: string
}

async function bench(): Promise<BenchResult[]> {
  return await Promise.all(
    BENCH_FILES.map(async (filename) => {
      try {
        const startTime = Date.now()

        const result = await runInSubprocess(filename)

        console.error(
          `[${++completed}/${COUNT}] ${filename} completed! ${(
            (Date.now() - startTime) /
            1_000
          ).toFixed(1)}s`,
        )

        return { filename, ...result }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        console.error(
          `[${++completed}/${COUNT}] ${filename} FAILED: ${errorMessage}`,
        )

        return { exitCode: 1, filename, stderr: errorMessage, stdout: '' }
      }
    }),
  )
}

interface BenchmarkBlock {
  delta: number | null
  text: string
}

const EXTRACT_INSTANTIATIONS_BASELINE_REGEX = /🎯 Baseline: ([\d.]+)/
const EXTRACT_INSTANTIATIONS_DELTA_REGEX = /📊 Delta: ([+\-]?[\d.]+)%/
const EXTRACT_INSTANTIATIONS_RESULT = /⛳ Result: ([\d.]+)/
const RESULT_BLOCK_DELIMITER_REGEX = /\n\s*\n/

function parseBlocks(input: string): BenchmarkBlock[] {
  return input
    .split(RESULT_BLOCK_DELIMITER_REGEX)
    .filter((block) => block.trim() !== '' && block.includes('🏌️'))
    .map((text) => {
      const [, deltaString] =
        text.match(EXTRACT_INSTANTIATIONS_DELTA_REGEX) || []

      if (deltaString != null) {
        const delta = parseFloat(deltaString)

        return { delta, text }
      }

      const [, baselineString] =
        text.match(EXTRACT_INSTANTIATIONS_BASELINE_REGEX) || []
      const [, resultString] = text.match(EXTRACT_INSTANTIATIONS_RESULT) || []

      if (!baselineString && !resultString) {
        return { delta: null, text }
      }

      const baseline = parseFloat(baselineString)
      const result = parseFloat(resultString)

      const delta = baseline === 0 ? Infinity : (result / baseline - 1) * 100

      return {
        delta,
        text: `${text}\n📊 Delta: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`,
      }
    })
}

console.error(`Running ${COUNT} benchmarks...\n`)

const startTime = Date.now()

const results = await bench()

console.error(
  `\nAll benchmarks completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`,
)

printSummary(results)

process.exitCode = Math.max(...results.map((result) => result.exitCode))

function printSummary(results: BenchResult[]): void {
  const output = results.map((result) => result.stdout).join('\n')

  const blocks = parseBlocks(output)

  const changedTextBlocks = blocks
    .filter(({ delta }) => delta != null && delta !== 0)
    .map((block) => block.text)

  if (changedTextBlocks.length === 0) {
    return console.log('✅ ⏱️  No benchmark changes detected.')
  }

  console.log(
    `⏱️  Benchmark changes detected:\n\n${changedTextBlocks.join('\n\n')}`,
  )
}
