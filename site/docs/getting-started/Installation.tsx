import type { ReactNode } from 'react'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import {
  getBashCommand,
  getDenoCommand,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type Command,
  type PackageManager,
} from './shared'

interface PackageManagerDetails {
  value: PackageManager
  description: ReactNode
  command: Command
}

const JavaScriptLink = () => (
  <Link to="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    JavaScript
  </Link>
)
const NodeJSLink = () => <Link to="https://nodejs.org">Node.js</Link>

const packageManagers: PackageManagerDetails[] = [
  {
    value: 'npm',
    description: (
      <>
        <Link to="https://npmjs.com">{PRETTY_PACKAGE_MANAGER_NAMES.npm}</Link>{' '}
        is the default package manager for <NodeJSLink />, and to where Kysely
        is published.
        <br />
        Your project is using {PRETTY_PACKAGE_MANAGER_NAMES.npm} if it has a{' '}
        <code>package-lock.json</code> file in its root folder.
      </>
    ),
    command: getBashCommand('npm', 'kysely'),
  },
  {
    value: 'pnpm',
    description: (
      <>
        <Link to="https://pnpm.io">{PRETTY_PACKAGE_MANAGER_NAMES.pnpm}</Link> is
        a fast, disk space efficient package manager for <NodeJSLink />
        .
        <br />
        Your project is using {PRETTY_PACKAGE_MANAGER_NAMES.pnpm} if it has a{' '}
        <code>pnpm-lock.yaml</code> file in its root folder.
      </>
    ),
    command: getBashCommand('pnpm', 'kysely'),
  },
  {
    value: 'yarn',
    description: (
      <>
        <Link to="https://yarnpkg.com">
          {PRETTY_PACKAGE_MANAGER_NAMES.yarn}
        </Link>{' '}
        is a fast, reliable and secure dependency manager for <NodeJSLink />
        .
        <br />
        Your project is using {PRETTY_PACKAGE_MANAGER_NAMES.yarn} if it has a{' '}
        <code>yarn.lock</code> file in its root folder.
      </>
    ),
    command: getBashCommand('yarn', 'kysely'),
  },
  {
    value: 'deno',
    description: (
      <>
        <Link to="https://deno.com/runtime">
          {PRETTY_PACKAGE_MANAGER_NAMES.deno}
        </Link>{' '}
        is a secure runtime for <JavaScriptLink /> and{' '}
        <Link to="https://www.typescriptlang.org">TypeScript</Link>.
      </>
    ),
    command: getDenoCommand(),
  },
  {
    value: 'bun',
    description: (
      <>
        <Link to="https://bun.sh">{PRETTY_PACKAGE_MANAGER_NAMES.bun}</Link> is a
        new <JavaScriptLink /> runtime built for speed, with a native bundler,
        transpiler, test runner, and {PRETTY_PACKAGE_MANAGER_NAMES.npm}
        -compatible package manager baked-in.
      </>
    ),
    command: getBashCommand('bun', 'kysely'),
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
