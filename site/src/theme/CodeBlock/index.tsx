import React from 'react'
import CodeBlock from '@theme-original/CodeBlock'
import type { Props } from '@theme/CodeBlock'
import { useLocation } from '@docusaurus/router'

// Code is the highest-signal content on a query-builder docs site: let
// syntax searches (".with", "selectFrom") rank pages whose code uses the
// API above pages that merely mention the word in prose. Example snippets
// are the canonical usage, so their code outweighs code in recipes and
// guides. (Nested Pagefind weights override, not multiply, so the page
// weight in DocItem/Layout does not reach code regions.)
export default function CodeBlockWrapper(props: Props): React.JSX.Element {
  const { pathname } = useLocation()
  const weight = pathname.startsWith('/docs/examples/') ? '8' : '2'

  return (
    <div data-pagefind-weight={weight}>
      <CodeBlock {...props} />
    </div>
  )
}
