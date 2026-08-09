/**
 * Pins the production wall's GitHub evidence links to commit SHAs
 * (permalinks), so proof stays valid even if a project later removes kysely.
 *
 * For every entry in src/data/production-proof.json that has a `repo`:
 *   1. Resolves the repo's current default-branch HEAD commit.
 *   2. Confirms the proof file still exists there and still mentions kysely.
 *   3. On success, re-pins `sha` and `href` to that commit and stamps
 *      `provenAt` with the commit's date.
 *      Hybrid entries whose href fronts a statement keep that href.
 *   4. On failure, keeps the existing permalink (old proof remains valid
 *      forever) and prints a warning so we can investigate.
 *
 * Entries without a `repo` (statements, issue comments) keep their href, but
 * get `provenAt` stamped once from the statement's publish date: issue
 * comments via the GitHub API, x.com posts via their snowflake id. Other
 * sources (e.g. reddit) need a manual `provenAt`.
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

async function statementDate(href) {
  const comment = href.match(
    /github\.com\/([^/]+)\/([^/]+)\/.*#issuecomment-(\d+)/,
  )
  if (comment) {
    const [, owner, repo, id] = comment
    const { created_at } = await github(
      `/repos/${owner}/${repo}/issues/comments/${id}`,
    )
    return created_at
  }

  const post = href.match(/(?:x|twitter)\.com\/\w+\/status\/(\d+)/)
  if (post) {
    // Snowflake ids carry a millisecond timestamp above the twepoch.
    const ms = Number((BigInt(post[1]) >> 22n) + 1288834974657n)
    return new Date(ms).toISOString()
  }

  throw new Error('cannot date this source; set provenAt manually')
}

const entries = JSON.parse(await readFile(dataPath, 'utf8'))
let failures = 0

for (const entry of entries) {
  if (!entry.repo) {
    if (!entry.provenAt) {
      try {
        entry.provenAt = (await statementDate(entry.href)).slice(0, 10)
        console.log(`ok   ${entry.name} said ${entry.provenAt}`)
      } catch (error) {
        failures++
        console.warn(`warn ${entry.name}: ${error.message}`)
      }
    }
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

    // Wrapper-importing modules (e.g. Stacks' @stacksjs/database) never say
    // "kysely"; query-builder calls are equally binding evidence.
    if (
      !/kysely/i.test(content) &&
      !/\.(selectFrom|insertInto|updateTable|deleteFrom)\s*\(/.test(content)
    ) {
      throw new Error('file no longer shows kysely usage')
    }

    entry.sha = sha
    // Hybrid entries front a statement (href points at a comment, not this
    // repo) while the pin backs the score; only permalink hrefs re-pin.
    if (entry.href.includes(`github.com/${entry.repo}/blob/`)) {
      entry.href = `https://github.com/${entry.repo}/blob/${sha}/${entry.path}`
    }
    entry.provenAt = branch.commit.commit.committer.date.slice(0, 10)
    console.log(`ok   ${entry.name} @ ${sha.slice(0, 7)} (${entry.provenAt})`)
  } catch (error) {
    failures++
    console.warn(
      `warn ${entry.name}: ${error.message}; keeping existing permalink`,
    )
  }
}

await writeFile(dataPath, `${JSON.stringify(entries, null, 2)}\n`)

if (failures > 0) {
  process.exitCode = 1
}
