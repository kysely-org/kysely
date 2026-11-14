import Admonition from '@theme/Admonition'
import { TypeScriptCode } from './TypeScriptCode'
import Link from '@docusaurus/Link'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import {
  DEFAULT_DIALECT,
  DIALECTS,
  useSearchState,
  type PropsWithDialect,
} from './shared'
import { repositoryCode } from './snippets'

export function Querying(props: PropsWithDialect) {
  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
  })

  return (
    <>
      <p>
        <strong>Let's implement the person repository:</strong>
      </p>
      <TypeScriptCode
        title="src/PersonRepository.ts"
        code={repositoryCode(dialect)}
      />
      <IUseADifferentDialect
        dialect={dialect}
        dialectSelectionID={props.dialectSelectionID}
      />
      <Admonition type="info" title="But wait, there's more!">
        This is a simplified example with basic CRUD operations. Kysely supports
        many more SQL features including: joins, subqueries, complex boolean
        logic, set operations, CTEs, functions (aggregate and window functions
        included), raw SQL, transactions, DDL queries, etc.
        <br />
        Find out more at <Link to="/docs/category/examples">Examples</Link>.
      </Admonition>
    </>
  )
}
