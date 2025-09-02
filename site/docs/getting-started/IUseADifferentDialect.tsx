import Link from '@docusaurus/Link'
import {
  DEFAULT_DIALECT,
  PRETTY_DIALECT_NAMES,
  type PropsWithDialect,
} from './shared'

export function IUseADifferentDialect(
  props: Pick<PropsWithDialect, 'dialect' | 'dialectSelectionID'>,
) {
  const { dialect, dialectSelectionID } = props

  if (!dialectSelectionID) {
    return null
  }

  const dialectName = PRETTY_DIALECT_NAMES[dialect || DEFAULT_DIALECT]

  return (
    <p style={{ display: 'flex', justifyContent: 'end' }}>
      <Link to={`#${dialectSelectionID}`}>
        I use a different dialect (not {dialectName})
      </Link>
    </p>
  )
}
