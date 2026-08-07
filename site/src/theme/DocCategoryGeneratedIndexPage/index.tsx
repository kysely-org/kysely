import React from 'react'
import DocCategoryGeneratedIndexPage from '@theme-original/DocCategoryGeneratedIndexPage'
import type {Props} from '@theme/DocCategoryGeneratedIndexPage'

// Generated category pages (/docs/category/*) are navigation stubs; their
// children are indexed individually, so keep the stubs out of the search
// index. Pagefind drops pages whose content is entirely ignored.
export default function DocCategoryGeneratedIndexPageWrapper(
  props: Props,
): React.JSX.Element {
  return (
    <div data-pagefind-ignore="all">
      <DocCategoryGeneratedIndexPage {...props} />
    </div>
  )
}
