import type { ReactNode } from 'react'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import {
  getBashCommand,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type Command,
  type PackageManager,
} from './shared'

interface PackageManagerDetails {
  value: PackageManager
  description: ReactNode
  command: Command
}

const nodeRuntimeDescription = (
  <>
    Kysely's query builder uses standard JavaScript APIs. Use a{' '}
    <Link to="https://nodejs.org/en/about/previous-releases">
      non-EOL Node.js release
    </Link>{' '}
    that meets Kysely's <code>node &gt;=22</code> package engine requirement. We
    test non-EOL Node.js releases in CI. Your database driver may have its own
    runtime requirements.
  </>
)

const packageManagers: PackageManagerDetails[] = [
  {
    value: 'npm',
    description: nodeRuntimeDescription,
    command: getBashCommand('npm', 'kysely'),
  },
  {
    value: 'pnpm',
    description: nodeRuntimeDescription,
    command: getBashCommand('pnpm', 'kysely'),
  },
  {
    value: 'yarn',
    description: nodeRuntimeDescription,
    command: getBashCommand('yarn', 'kysely'),
  },
  {
    value: 'bun',
    description: (
      <>
        Kysely's query builder uses standard JavaScript APIs. We test{' '}
        <Link to="https://bun.sh">Bun</Link> in CI and target releases that have
        not reached end of life. Your database driver may have its own runtime
        requirements.
      </>
    ),
    command: getBashCommand('bun', 'kysely'),
  },
  {
    value: 'deno',
    description: (
      <>
        Kysely's query builder uses standard JavaScript APIs. We test{' '}
        <Link to="https://docs.deno.com/runtime/fundamentals/stability_and_releases/">
          Deno
        </Link>{' '}
        in CI and target stable and LTS releases that have not reached end of
        life. Your database driver may have its own runtime requirements.
      </>
    ),
    command: getBashCommand('deno', 'jsr:@kysely/kysely'),
  },
]

export function Installation() {
  return (
    <>
      <p>
        Kysely can be installed using any of the following package managers:
      </p>
      {/* @ts-ignore For some odd reason, Tabs doesn't accept children in this file. */}
      <Tabs queryString="package-manager">
        {packageManagers.map(({ command, value, ...packageManager }) => (
          // @ts-ignore For some odd reason, TabItem doesn't accept children in this file.
          <TabItem
            key={value}
            value={value}
            label={PRETTY_PACKAGE_MANAGER_NAMES[value]}
          >
            <p>{packageManager.description}</p>
            <p>
              <strong>{command.intro}</strong>
            </p>
            <CodeBlock language={command.language} title={command.title}>
              {command.content}
            </CodeBlock>
          </TabItem>
        ))}
      </Tabs>
    </>
  )
}
