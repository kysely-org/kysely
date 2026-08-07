import React from 'react'
import Layout from '@theme-original/DocItem/Layout'
import type { Props } from '@theme/DocItem/Layout'
import { useLocation } from '@docusaurus/router'

// Example pages are the canonical syntax references; weight them so a
// search like ".with" ranks the CTE examples above recipes and guides
// that merely use the same word. Multiplies with the code-block weight
// from the CodeBlock swizzle.
export default function LayoutWrapper(props: Props): React.JSX.Element {
  const { pathname } = useLocation()

  if (pathname.startsWith('/docs/examples/')) {
    return (
      <div data-pagefind-weight="3">
        <Layout {...props} />
      </div>
    )
  }

  return <Layout {...props} />
}
