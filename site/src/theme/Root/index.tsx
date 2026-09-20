import React from 'react'
import type { Props } from '@theme/Root'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

export default function Root({ children }: Props): React.JSX.Element {
  const indexUrl = useBaseUrl('/llms.txt')
  const fullDocsUrl = useBaseUrl('/llms-full.txt')

  return (
    <>
      <div
        aria-hidden="true"
        className={styles.agentDocs}
        data-pagefind-ignore="all"
      >
        AI agents: Read{' '}
        <a href={indexUrl} tabIndex={-1}>
          llms.txt
        </a>{' '}
        for the documentation index and links to Markdown (.md) versions of
        individual pages. Read{' '}
        <a href={fullDocsUrl} tabIndex={-1}>
          llms-full.txt
        </a>{' '}
        for the full documentation in one file.
      </div>
      {children}
    </>
  )
}
