/**
 * Pins the production wall's GitHub evidence links to commit SHAs
 * (permalinks), so proof stays valid even if a project later removes kysely.
 *
 * For every entry in src/data/production-proof.json that has a `repo`:
 *   1. Resolves the repo's current default-branch HEAD commit.
 *   2. Confirms the proof file still exists there and still mentions kysely.
 *   3. On success, re-pins `sha` and `href` to that commit.
 *   4. On failure, keeps the existing permalink (old proof remains valid
 *      forever) and prints a warning so we can investigate.
 *
 * Entries without a `repo` (statements, issue comments) are left untouched.
 *
 * Run periodically: pnpm proof-links
 * Set GITHUB_TOKEN to avoid unauthenticated rate limits.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const dataPath = join(siteRoot, 'src', 'data', 'production-proof.json')

const headers = { 'user-agent': 'kysely-site-proof-links' }
if (process.env.GITHUB_TOKEN) {
  headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers })

  if (!response.ok) {
    throw new Error(`GET ${path} -> ${response.status}`)
  }

  return await response.json()
}

const entries = JSON.parse(await readFile(dataPath, 'utf8'))
let failures = 0

for (const entry of entries) {
  if (!entry.repo) {
    continue
  }

  try {
    const repo = await github(`/repos/${entry.repo}`)
    const branch = await github(
      `/repos/${entry.repo}/branches/${repo.default_branch}`,
    )
    const sha = branch.commit.sha

    const file = await github(
      `/repos/${entry.repo}/contents/${entry.path}?ref=${sha}`,
    )
    const content = Buffer.from(file.content, 'base64').toString('utf8')

    if (!/kysely/i.test(content)) {
      throw new Error('file no longer mentions kysely')
    }

    entry.sha = sha
    entry.href = `https://github.com/${entry.repo}/blob/${sha}/${entry.path}`
    console.log(`ok   ${entry.name} @ ${sha.slice(0, 7)}`)
  } catch (error) {
    failures++
    console.warn(`warn ${entry.name}: ${error.message}; keeping existing permalink`)
  }
}

await writeFile(dataPath, `${JSON.stringify(entries, null, 2)}\n`)

if (failures > 0) {
  process.exitCode = 1
}
