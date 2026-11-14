import Admonition from '@theme/Admonition'
import { TypeScriptCode } from './TypeScriptCode'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import { IUseADifferentPackageManager } from './IUseADifferentPackageManager'
import {
  type PropsWithDialect,
  DIALECT_CLASS_NAMES,
  type PropsWithPackageManager,
  useSearchState,
  DIALECTS,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_DIALECT,
  PACKAGE_MANAGERS,
} from './shared'
import { databaseCode } from './snippets'

export type InstantiationProps = PropsWithDialect<PropsWithPackageManager>

export function Instantiation(props: InstantiationProps) {
  const { dialectSelectionID, packageManagerSelectionID } = props

  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
  })
  const packageManager = useSearchState({
    defaultValue: DEFAULT_PACKAGE_MANAGER,
    searchParam: props.packageManagerSearchParam,
    validator: (value) => PACKAGE_MANAGERS.includes(value as never),
    value: props.packageManager,
  })

  const dialectClassName = DIALECT_CLASS_NAMES[dialect]

  return (
    <>
      <p>
        <strong>Let's create a Kysely instance</strong>
        <strong> using the built-in </strong>
        <code>{dialectClassName}</code>
        <strong> dialect</strong>
        <strong>:</strong>
      </p>
      <TypeScriptCode
        title="src/database.ts"
        code={databaseCode(dialect, packageManager)}
      />
      {dialectSelectionID || packageManagerSelectionID ? (
        <div style={{ display: 'flex', gap: '25px', justifyContent: 'end' }}>
          <IUseADifferentPackageManager
            packageManager={packageManager}
            packageManagerSelectionID={packageManagerSelectionID}
          />
          <IUseADifferentDialect
            dialect={dialect}
            dialectSelectionID={dialectSelectionID}
          />
        </div>
      ) : null}
      <Admonition type="tip" title="Singleton">
        In most cases, you should only create a single Kysely instance per
        database. Most dialects use a connection pool internally, or no
        connections at all, so there's no need to create a new instance for each
        request.
      </Admonition>
      <Admonition type="warning" title="keeping secrets">
        Use a secrets manager, environment variables (DO NOT commit `.env` files
        to your repository), or a similar solution, to avoid hardcoding database
        credentials in your code.
      </Admonition>
      <Admonition type="info" title="Closing connections">
        <p>
          When Kysely is responsible for closing its connections, pool, or
          database instance, call <code>await db.destroy()</code> when you are
          done using it to release those resources.
        </p>
        <p>
          If you share the pool or database instance with other consumers or
          manage its lifecycle elsewhere, skip <code>db.destroy()</code>. Let
          the application close it once all consumers, including Kysely, have
          finished. No separate cleanup of the Kysely instance is needed.
        </p>
        <p>
          Kysely initializes its driver lazily. Calling{' '}
          <code>db.destroy()</code> before initialization has started does
          nothing, even if you have used the supplied pool or database instance
          independently.
        </p>
      </Admonition>
    </>
  )
}
