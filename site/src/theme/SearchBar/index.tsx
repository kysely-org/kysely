import React, {useEffect, useRef, useState} from 'react'
import {useColorMode} from '@docusaurus/theme-common'

// While prototyping, the API reference index is served locally with CORS.
// In production this becomes: https://kysely-org.github.io/kysely-apidoc/pagefind/
const APIDOC_PAGEFIND_URL = 'http://localhost:8081/pagefind/'

// The bundle only exists in production builds (`pnpm build` + `pagefind
// --site build`), so search is a no-op in `docusaurus start`.
const SITE_PAGEFIND_URL = '/pagefind/'

declare global {
  interface Window {
    PagefindComponents?: {
      configureInstance: (instance: string, options: object) => void
    }
  }
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'pagefind-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {instance?: string; 'reset-on-close'?: boolean}
      'pagefind-modal-trigger': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        instance?: string
        placeholder?: string
        shortcut?: string
        compact?: boolean
      }
    }
  }
}

// A dead merged index is fatal: searches await it and hang, so an
// unreachable API docs origin (outage, or the bundle not deployed yet)
// would break every search. Probe before merging; when the probe fails,
// search runs guide-only.
let apidocIndexProbe: Promise<boolean> | undefined

function probeApidocIndex(): Promise<boolean> {
  apidocIndexProbe ??= fetch(`${APIDOC_PAGEFIND_URL}pagefind-entry.json`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(2000),
  }).then(
    (response) => response.ok,
    () => false,
  )

  return apidocIndexProbe
}

let componentAssets: Promise<void> | undefined

function loadComponentAssets(): Promise<void> {
  componentAssets ??= new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${SITE_PAGEFIND_URL}pagefind-component-ui.css`
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.type = 'module'
    script.src = `${SITE_PAGEFIND_URL}pagefind-component-ui.js`
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Pagefind. Is this a production build?'))
    document.head.appendChild(script)
  })

  return componentAssets
}

export default function SearchBar(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false)
  // Rendered during SSR, so default to Mac and correct after mount.
  const [modifierKey, setModifierKey] = useState('⌘')
  const {colorMode} = useColorMode()

  useEffect(() => {
    if (!/mac/i.test(navigator.platform)) {
      setModifierKey('Ctrl')
    }
  }, [])
  const modalRef = useRef<
    (HTMLElement & {instance?: {triggerSearch?: (term: string) => void}}) | null
  >(null)

  // `reset-on-close` only takes effect on close paths that run the
  // component's handleClose; a native dialog cancel skips it, and the
  // dialog's `close` event doesn't propagate reliably. The [open]
  // attribute is the one truth every close path shares, so watch it.
  useEffect(() => {
    const modal = modalRef.current

    if (!isReady || !modal) {
      return
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.target instanceof HTMLDialogElement &&
          !mutation.target.open
        ) {
          modal.instance?.triggerSearch?.('')

          // The input doesn't sync from instance state while the dialog is
          // closed, and pushes its stale value back into a new search on
          // reopen; clear it directly.
          const searchInput = modal.querySelector('input')
          if (searchInput && searchInput.value !== '') {
            searchInput.value = ''
            searchInput.dispatchEvent(new Event('input', {bubbles: true}))
          }
        }
      }
    })

    observer.observe(modal, {
      attributeFilter: ['open'],
      attributes: true,
      subtree: true,
    })

    // Source hints on result titles, rendered by CSS from this attribute.
    // API results live on another origin and additionally open in a new
    // tab. Results render lazily, so stamp links as they appear.
    const SECTION_BADGES: Record<string, string> = {
      examples: 'Example',
      integrations: 'Integration',
      recipes: 'Recipe',
    }

    const badgeFor = (link: HTMLAnchorElement): string | null => {
      const url = new URL(link.href, window.location.href)

      if (url.origin !== window.location.origin) {
        return 'API'
      }

      const section = url.pathname.match(/^\/docs\/([^/]+)\//)?.[1]
      return (section && SECTION_BADGES[section]) || null
    }

    const stampResultLinks = (root: ParentNode) => {
      for (const link of root.querySelectorAll?.('a[href]') ?? []) {
        if (!(link instanceof HTMLAnchorElement)) {
          continue
        }

        const badge = badgeFor(link)
        if (!badge) {
          continue
        }

        if (badge === 'API') {
          link.target = '_blank'
          link.rel = 'noopener'
        }

        link.setAttribute('data-result-badge', badge)

        // Examples get a secondary pill with their category, e.g. "where".
        // Rendered from the title element, since the link's ::after is
        // taken by the primary badge.
        if (badge === 'Example') {
          const category = new URL(link.href, window.location.href).pathname
            .split('/')[3]
          if (category) {
            link
              .closest('.pf-result-title')
              ?.setAttribute('data-result-badge-detail', category)
          }
        }
      }
    }

    const linkObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            stampResultLinks(node)
          }
        }
      }
    })

    stampResultLinks(modal)
    linkObserver.observe(modal, {childList: true, subtree: true})

    return () => {
      observer.disconnect()
      linkObserver.disconnect()
    }
  }, [isReady])

  useEffect(() => {
    let cancelled = false

    void Promise.all([loadComponentAssets(), probeApidocIndex()])
      .then(([, includeApidocIndex]) => {
        if (cancelled) {
          return
        }

        if (!includeApidocIndex) {
          console.warn('[search] API docs index unreachable, searching guides only')
        }

        // Must run before the components below mount: a connected component
        // creates the instance with defaults and this call would be ignored.
        window.PagefindComponents?.configureInstance('default', {
          bundlePath: SITE_PAGEFIND_URL,
          mergeIndex: includeApidocIndex
            ? [
                {
                  bundlePath: APIDOC_PAGEFIND_URL,
                  // Typedoc pages score ~16-20x higher raw than guide pages
                  // for shared terms (exact term in title + dense short
                  // pages), so this needs to be tiny for guides to rank
                  // first. Calibrated against real scores: 0.05 still let
                  // "insert" go all-API, 0.02 over-buried exact API-name
                  // matches. Queries with no guide coverage (e.g. "stream")
                  // still surface API results.
                  indexWeight: 0.03,
                },
              ]
            : [],
        })

        setIsReady(true)
      })
      .catch((error) => {
        console.warn('[search]', error)
      })

    // Like pagefind.app: while the modal is open, the page scrollbar stays
    // rendered but scrolling is inert outside the modal. The component
    // doesn't do this itself.
    const onScrollIntent = (event: Event) => {
      if (
        document.querySelector(
          'pagefind-modal-trigger button[aria-expanded="true"]',
        ) &&
        (!(event.target instanceof Element) ||
          !event.target.closest('pagefind-modal'))
      ) {
        event.preventDefault()
      }
    }

    document.addEventListener('wheel', onScrollIntent, {passive: false})
    document.addEventListener('touchmove', onScrollIntent, {passive: false})

    return () => {
      cancelled = true
      document.removeEventListener('wheel', onScrollIntent)
      document.removeEventListener('touchmove', onScrollIntent)
    }
  }, [])

  if (!isReady) {
    // Static stand-in during SSR and while the bundle loads; also what
    // `docusaurus start` shows, where no Pagefind bundle exists. Clones the
    // live trigger's markup so the swap is pixel-identical.
    return (
      <button aria-label="Search" className="pf-trigger-btn" type="button">
        <span aria-hidden="true" className="pf-trigger-icon" />
        <span className="pf-trigger-text">Search</span>
        <span aria-hidden="true" className="pf-trigger-shortcut">
          <span className="pf-trigger-key">{modifierKey}</span>
          <span className="pf-trigger-key">K</span>
        </span>
      </button>
    )
  }

  return (
    // Custom-element props must stay off the JSX: React 19 assigns known
    // properties directly, and these elements expose getter-only reflections
    // (setting `placeholder` throws). Defaults are right anyway.
    <div data-pf-theme={colorMode === 'dark' ? 'dark' : undefined}>
      <pagefind-modal-trigger />
      <pagefind-modal ref={modalRef} reset-on-close />
    </div>
  )
}
