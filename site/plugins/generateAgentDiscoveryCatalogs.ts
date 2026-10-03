import type { Plugin } from '@docusaurus/types'
import { DEFAULT_PARSE_FRONT_MATTER } from '@docusaurus/utils'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'

export default function generateAgentDiscoveryCatalogs(): Plugin {
  return {
    name: 'generateAgentDiscoveryCatalogs',
    async postBuild({ outDir, siteDir, siteConfig }) {
      const directories = await readdir(join(siteDir, 'static/skills'), {
        withFileTypes: true,
      }).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return []
        throw error
      })
      const skills = []
      const entries = []
      for (const directory of directories
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()) {
        const skillUrl = `/skills/${directory}/SKILL.md`
        const filePath = join(outDir, skillUrl)
        const content = await readFile(filePath)
        const { frontMatter } = await DEFAULT_PARSE_FRONT_MATTER({
          filePath,
          fileContent: content.toString('utf8'),
        })
        const { name, description, metadata } = frontMatter as {
          name: string
          description: string
          metadata?: Record<string, string>
        }
        if (
          name !== directory ||
          typeof description !== 'string' ||
          !description.trim()
        ) {
          throw new Error(`Invalid skill name or description in ${filePath}`)
        }
        skills.push({
          name,
          type: 'skill-md',
          description,
          url: skillUrl,
          digest: `sha256:${createHash('sha256').update(content).digest('hex')}`,
        })
        entries.push({
          identifier: `urn:air:${new URL(siteConfig.url).hostname}:skill:${name}`,
          displayName: metadata?.displayName ?? name,
          type: 'application/ai-skill+md',
          url: new URL(skillUrl, siteConfig.url).href,
          description,
          representativeQueries: (metadata?.representativeQueries ?? '')
            .split('\n')
            .map((query) => query.trim())
            .filter(Boolean),
        })
      }
      const catalog = { specVersion: '1.0', entries }
      const files = {
        'ard.json': catalog,
        'ai-catalog.json': catalog,
        'agent-skills/index.json': {
          $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
          skills,
        },
      }
      await mkdir(join(outDir, '.well-known/agent-skills'), {
        recursive: true,
      })
      await Promise.all(
        Object.entries(files).map(([file, data]) =>
          writeFile(
            join(outDir, '.well-known', file),
            JSON.stringify(data, null, 2) + '\n',
          ),
        ),
      )
    },
  }
}
