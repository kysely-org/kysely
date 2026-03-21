/**
 * Parallel TypeScript Benchmark Runner
 *
 * Runs all .bench.ts files in parallel with isolated .attest caches.
 * Each benchmark runs in its own temporary directory to avoid race conditions.
 *
 * Environment variables:
 * - SEQUENTIAL=1: Run benchmarks sequentially (old behavior, for debugging)
 */

import { spawn } from 'node:child_process'
import { cpus, tmpdir } from 'node:os'
import { mkdtemp, rm, symlink, copyFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../..')
const benchDir = __dirname

// Discover benchmark files
const allFiles = await readdir(benchDir)
const benchFiles = allFiles
  .filter((f) => f.endsWith('.bench.ts') && f !== 'index.ts')
  .sort() // Sort alphabetically for consistent output

// Sequential mode (fallback for debugging)
if (process.env.SEQUENTIAL === '1') {
  for (const file of benchFiles) {
    await import('./' + file)
  }
  process.exit(0)
}

// Parallel mode
const concurrency = benchFiles.length
const tempDirs: string[] = []
const startTime = Date.now()

// Progress tracking
let completed = 0
const total = benchFiles.length

console.error(`Running ${total} benchmarks...\n`)

// Cleanup handler
const cleanup = async () => {
  await Promise.all(
    tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
  )
}

process.on('SIGINT', async () => {
  console.error('\nCleaning up...')
  await cleanup()
  process.exit(130)
})

process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(143)
})

// Setup isolated environment for benchmark
async function setupEnvironment(tempDir: string, benchFile: string) {
  try {
    // Try symlinks first (fast)
    await symlink(
      join(projectRoot, 'node_modules'),
      join(tempDir, 'node_modules'),
      'dir',
    )
    await symlink(join(projectRoot, 'dist'), join(tempDir, 'dist'), 'dir')
    await symlink(join(projectRoot, 'test'), join(tempDir, 'test'), 'dir')
    await symlink(join(benchDir, benchFile), join(tempDir, benchFile), 'file')
  } catch (err: any) {
    // Fallback: If symlinks fail (Windows permissions), we'd need to copy
    // For now, re-throw as this should work on all modern systems
    throw new Error(
      `Failed to create symlinks in ${tempDir}: ${err.message}. ` +
        `Try running with elevated permissions or set SEQUENTIAL=1.`,
    )
  }

  // Copy config files (small, always works)
  await copyFile(
    join(projectRoot, 'package.json'),
    join(tempDir, 'package.json'),
  )
  await copyFile(
    join(projectRoot, 'tsconfig-base.json'),
    join(tempDir, 'tsconfig-base.json'),
  )
}

// Spawn benchmark process
async function spawnBenchmark(
  tempDir: string,
  benchFile: string,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('node', ['--experimental-strip-types', benchFile], {
      cwd: tempDir,
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
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      })
    })
  })
}

// Run single benchmark
async function runBenchmark(benchFile: string) {
  const tempDir = await mkdtemp(
    join(tmpdir(), `kysely-bench-${randomBytes(4).toString('hex')}-`),
  )
  tempDirs.push(tempDir)

  try {
    await setupEnvironment(tempDir, benchFile)
    const result = await spawnBenchmark(tempDir, benchFile)

    completed++
    console.error(`[${completed}/${total}] ${benchFile} completed`)

    return { file: benchFile, ...result }
  } catch (err: any) {
    completed++
    console.error(`[${completed}/${total}] ${benchFile} FAILED: ${err.message}`)
    return {
      file: benchFile,
      exitCode: 1,
      stdout: '',
      stderr: err.message,
    }
  }
}

// Concurrency pool
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<any>[] = []

  for (const item of items) {
    const promise = fn(item).then((result) => {
      executing.splice(executing.indexOf(promise), 1)
      return result
    })

    results.push(promise as any)
    executing.push(promise)

    if (executing.length >= limit) {
      await Promise.race(executing)
    }
  }

  return Promise.all(results)
}

// Summary processing (from bench-summary.ts logic)
interface BenchmarkBlock {
  text: string
  hasGolfEmoji: boolean
  hasDelta: boolean
  deltaValue: number | null
}

function parseBlocks(input: string): BenchmarkBlock[] {
  const blockTexts = input
    .split(/\n\s*\n/)
    .filter((block) => block.trim() !== '')

  return blockTexts.map((text) => {
    const hasGolfEmoji = text.includes('🏌️')
    let hasDelta = /📊 Delta:/.test(text)
    let deltaValue: number | null = null
    let processedText = text

    // Check if block has Baseline but no Delta - calculate it
    if (/🎯 Baseline:/.test(text) && !hasDelta) {
      const resultMatch = text.match(/⛳ Result: ([\d.]+)/)
      const baselineMatch = text.match(/🎯 Baseline: ([\d.]+)/)

      if (resultMatch && baselineMatch) {
        const result = parseFloat(resultMatch[1])
        const baseline = parseFloat(baselineMatch[1])

        if (baseline > 0) {
          deltaValue = (result / baseline - 1) * 100
          processedText = `${text}\n📊 Delta: ${deltaValue >= 0 ? '+' : ''}${deltaValue.toFixed(2)}%`
          hasDelta = true
        }
      }
    }

    // Extract delta value if present
    if (hasDelta && deltaValue === null) {
      const deltaMatch = processedText.match(/📊 Delta: ([+\-]?[\d.]+)%/)
      if (deltaMatch) {
        deltaValue = parseFloat(deltaMatch[1])
      }
    }

    return {
      text: processedText,
      hasGolfEmoji,
      hasDelta,
      deltaValue,
    }
  })
}

function filterChangedBlocks(blocks: BenchmarkBlock[]): string[] {
  return blocks
    .filter((block) => {
      if (!block.hasGolfEmoji) return false
      if (!block.hasDelta || block.deltaValue === null) return false
      return Math.abs(block.deltaValue) >= 0.005
    })
    .map((block) => block.text)
}

function processSummary(rawOutput: string): string {
  // Strip pnpm lines
  const stripped = rawOutput
    .split('\n')
    .filter((line) => !line.startsWith('> '))
    .join('\n')

  // Remove leading blank lines
  const lines = stripped.split('\n')
  const firstNonBlank = lines.findIndex((line) => line.trim() !== '')
  const cleaned =
    firstNonBlank === -1 ? '' : lines.slice(firstNonBlank).join('\n')

  const blocks = parseBlocks(cleaned)
  const changedBlocks = filterChangedBlocks(blocks)

  if (changedBlocks.length === 0) {
    return '✅ ⏱️  No benchmark changes detected.'
  } else {
    return '⏱️  Benchmark changes detected:\n\n' + changedBlocks.join('\n\n')
  }
}

// Run all benchmarks
try {
  const results = await runWithConcurrency(
    benchFiles,
    concurrency,
    runBenchmark,
  )

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.error(`\nAll benchmarks completed in ${totalTime}s\n`)

  // Combine all stdout in file order
  const resultsByFile = new Map(results.map((r) => [r.file, r]))
  const combinedOutput = benchFiles
    .map((file) => resultsByFile.get(file)?.stdout || '')
    .join('\n')

  // Process and print summary
  const summary = processSummary(combinedOutput)
  console.log(summary)

  // Cleanup
  await cleanup()

  // Exit with max exit code
  const maxExitCode = Math.max(...results.map((r) => r.exitCode))
  process.exit(maxExitCode)
} catch (err: any) {
  console.error('Fatal error:', err.message)
  await cleanup()
  process.exit(1)
}
