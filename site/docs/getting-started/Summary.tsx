import Admonition from '@theme/Admonition'
import { TypeScriptCode } from './TypeScriptCode'
import Link from '@docusaurus/Link'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import {
  DEFAULT_DIALECT,
  DEFAULT_PACKAGE_MANAGER,
  DIALECTS,
  PACKAGE_MANAGERS,
  useSearchState,
  type PropsWithDialect,
  type PropsWithPackageManager,
} from './shared'
import { specCode } from './snippets'

export function Summary(props: PropsWithDialect<PropsWithPackageManager>) {
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

  return (
    <>
      <p>
        We've seen how to install and instantiate Kysely, its dialects and
        underlying drivers. We've also seen how to use Kysely to query a
        database.
        <br />
        <br />
        <strong>Let's put it all to the test:</strong>
      </p>
      <TypeScriptCode
        title="src/PersonRepository.spec.ts"
        code={specCode(dialect, packageManager)}
      />
      <IUseADifferentDialect
        dialect={dialect}
        dialectSelectionID={props.dialectSelectionID}
      />
      <Admonition type="info" title="Migrations">
        As you can see, Kysely supports DDL queries. It also supports classic
        "up/down" migrations. Find out more at{' '}
        <Link to="/docs/migrations">Migrations</Link>.
      </Admonition>
    </>
  )
}
