import React from 'react'
import Link from '@docusaurus/Link'
import { PRETTY_DIALECT_NAMES, type PropsWithDialect } from './shared'

export function IUseADifferentDatabase(props: PropsWithDialect) {
  const dialectName = PRETTY_DIALECT_NAMES[props.dialect || 'postgresql']

  return (
    <p style={{ display: 'flex', justifyContent: 'end' }}>
      <Link to={props.dialectsURL}>
        I use a different database (not {dialectName})
      </Link>
    </p>
  )
}
