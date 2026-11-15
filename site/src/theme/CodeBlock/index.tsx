import React, { useEffect, useRef, useState } from 'react'
import type { Props } from '@theme/CodeBlock'
import { useLocation } from '@docusaurus/router'
import { Playground } from '../../components/Playground'
import { TypeHovers } from '../../components/TypeHovers'

interface ShikiProps extends Props {
  highlightedHtml?: string
  loadPopups?: () => Promise<readonly string[]>
  playground?: string
  popups?: string
}

// Markdown arrives highlighted at build time. Blocks authored in React load
// Shiki on demand; neither path loads a TypeScript compiler in the browser.
export default function CodeBlock({
  highlightedHtml,
  loadPopups: loadPopupList,
  playground,
  popups: popupsUrl,
  ...props
}: ShikiProps): React.JSX.Element {
  const { pathname } = useLocation()
  const code = React.Children.toArray(props.children)
    .join('')
    .replace(/\n$/, '')
  const language =
    props.language ?? props.className?.replace('language-', '') ?? 'text'
  const [rendered, setRendered] = useState<{ code: string; html: string }>()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const html =
    highlightedHtml ?? (rendered?.code === code ? rendered.html : undefined)

  useEffect(() => {
    if (highlightedHtml) return
    let cancelled = false
    import('shiki/bundle/web').then(
      async ({ codeToHtml, bundledLanguages }) => {
        const html = await codeToHtml(code, {
          lang: language in bundledLanguages ? language : 'text',
          themes: { light: 'light-plus', dark: 'dark-plus' },
          defaultColor: false,
        })
        if (!cancelled) setRendered({ code, html })
      },
    )
    return () => {
      cancelled = true
    }
  }, [code, language, highlightedHtml])

  useEffect(() => () => clearTimeout(timer.current), [])

  const loadPopups =
    loadPopupList ??
    (popupsUrl
      ? () =>
          fetch(popupsUrl).then(
            (response) => response.json() as Promise<readonly string[]>,
          )
      : undefined)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const block = (
    <div
      className="shiki-block code-example"
      data-pagefind-weight={pathname.startsWith('/docs/examples/') ? '8' : '2'}
    >
      <div className="shiki-toolbar" data-markdown-ignore data-pagefind-ignore>
        <span>{props.title || language}</span>
        <div>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Code copied' : 'Copy code'}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <TypeHovers loadPopups={loadPopups}>
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre>
            <code className={`language-${language}`}>{code}</code>
          </pre>
        )}
      </TypeHovers>
      <span className="shiki-copy-status" role="status">
        {copied ? 'Code copied' : ''}
      </span>
    </div>
  )

  return playground ? <Playground code={code}>{block}</Playground> : block
}
