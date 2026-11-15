import { TypeScriptCode } from './TypeScriptCode'
import {
  DEFAULT_PACKAGE_MANAGER,
  PACKAGE_MANAGERS,
  useSearchState,
  type PropsWithPackageManager,
} from './shared'
import { typesCode } from './snippets'

export function TypesCode(props: PropsWithPackageManager) {
  const packageManager = useSearchState({
    defaultValue: DEFAULT_PACKAGE_MANAGER,
    searchParam: props.packageManagerSearchParam,
    validator: (value) => PACKAGE_MANAGERS.includes(value as never),
    value: props.packageManager,
  })

  return (
    <TypeScriptCode title="src/types.ts" code={typesCode(packageManager)} />
  )
}
