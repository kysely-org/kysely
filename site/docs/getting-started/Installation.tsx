import CodeBlock from '@theme/CodeBlock'
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
  command: Command
}

const packageManagers: PackageManagerDetails[] = [
  {
    value: 'npm',
    command: getBashCommand('npm', 'kysely'),
  },
  {
    value: 'pnpm',
    command: getBashCommand('pnpm', 'kysely'),
  },
  {
    value: 'yarn',
    command: getBashCommand('yarn', 'kysely'),
  },
  {
    value: 'bun',
    command: getBashCommand('bun', 'kysely'),
  },
  {
    value: 'deno',
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
        {packageManagers.map(({ command, value }) => (
          // @ts-ignore For some odd reason, TabItem doesn't accept children in this file.
          <TabItem
            key={value}
            value={value}
            label={PRETTY_PACKAGE_MANAGER_NAMES[value]}
          >
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
