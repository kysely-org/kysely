import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function TypeHovers({
  children,
  className,
  loadPopups,
}: {
  children: React.ReactNode
  className?: string
  loadPopups?: () => Promise<readonly string[]>
}): React.JSX.Element {
  const [popup, setPopup] = useState<{
    html: string
    left: number
    top: number
  }>()
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const popups = useRef<Promise<readonly string[]> | undefined>(undefined)

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  function hideType() {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPopup(undefined), 120)
  }

  async function getPopupHtml(hover: Element) {
    const id = hover.getAttribute('data-popup')
    if (id == null || !loadPopups) return undefined
    try {
      return (await (popups.current ??= loadPopups()))[Number(id)]
    } catch {
      popups.current = undefined
      return undefined
    }
  }

  async function showType(target: EventTarget) {
    if (!(target instanceof Element)) return
    const hover = target.closest('.twoslash-hover')
    const popupHtml = hover ? await getPopupHtml(hover) : undefined
    if (
      !hover ||
      popupHtml == null ||
      !(hover.matches(':hover') || hover === document.activeElement)
    ) {
      hideType()
      return
    }
    clearTimeout(hoverTimer.current)
    const rect = hover.getBoundingClientRect()
    setPopup({
      html: popupHtml,
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

  return (
    <>
      <div
        className={className}
        onPointerEnter={() => {
          if (loadPopups && !popups.current) {
            popups.current = loadPopups()
            popups.current.catch(() => {})
          }
        }}
        onMouseOver={(event) => showType(event.target)}
        onMouseLeave={hideType}
        onFocus={(event) => showType(event.target)}
        onBlur={() => setPopup(undefined)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setPopup(undefined)
        }}
        onScroll={() => setPopup(undefined)}
      >
        {children}
      </div>
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
    </>
  )
}
