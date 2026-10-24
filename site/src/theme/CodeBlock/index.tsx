import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Props } from '@theme/CodeBlock'
import { useLocation } from '@docusaurus/router'
import { getPlaygroundUrl } from '../../components/playground-state'

interface ShikiProps extends Props {
  highlightedHtml?: string
  playground?: string
}

// Markdown arrives highlighted at build time. Blocks authored in React load
// Shiki on demand; neither path loads a TypeScript compiler in the browser.
export default function CodeBlock({
  highlightedHtml,
  playground,
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
  const [popup, setPopup] = useState<{
    html: string
    left: number
    top: number
  }>()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
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

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      clearTimeout(hoverTimer.current)
    },
    [],
  )

  function hideType() {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPopup(undefined), 120)
  }

  function showType(target: EventTarget) {
    if (!(target instanceof Element)) return
    const hover = target.closest('.twoslash-hover')
    const content = hover?.querySelector('.twoslash-popup-container')
    if (!hover || !content) {
      hideType()
      return
    }
    clearTimeout(hoverTimer.current)
    const rect = hover.getBoundingClientRect()
    setPopup({
      html: content.innerHTML,
      left: Math.max(
        8,
        Math.min(
          rect.left,
          window.innerWidth - Math.min(560, window.innerWidth - 16) - 8,
        ),
      ),
      top: Math.min(rect.bottom + 8, window.innerHeight * 0.55 - 8),
    })
  }

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

  return (
    <div
      className="shiki-block code-example"
      data-pagefind-weight={pathname.startsWith('/docs/examples/') ? '8' : '2'}
    >
      <div className="shiki-toolbar" data-pagefind-ignore>
        <span>{props.title || language}</span>
        <div>
          {playground && (
            <a
              href={getPlaygroundUrl(code)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Kysely Playground ↗
            </a>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Code copied' : 'Copy code'}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div
        onMouseOver={(event) => showType(event.target)}
        onMouseLeave={hideType}
        onFocus={(event) => showType(event.target)}
        onBlur={() => setPopup(undefined)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setPopup(undefined)
        }}
        onScroll={() => setPopup(undefined)}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre>
            <code>{code}</code>
          </pre>
        )}
      </div>
      <span className="shiki-copy-status" role="status">
        {copied ? 'Code copied' : ''}
      </span>
      {popup &&
        createPortal(
          <div
            className="shiki-type-popup twoslash"
            role="tooltip"
            onMouseEnter={() => clearTimeout(hoverTimer.current)}
            onMouseLeave={hideType}
            style={{ left: popup.left, top: popup.top }}
            data-pagefind-ignore
            dangerouslySetInnerHTML={{ __html: popup.html }}
          />,
          document.body,
        )}
    </div>
  )
}
