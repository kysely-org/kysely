import { useColorMode } from '@docusaurus/theme-common'
import { useId, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './Playground.module.css'
import { getPlaygroundUrl } from './playground-state'

const TABS = ['code', 'playground'] as const

type Tab = (typeof TABS)[number]

const LABELS: Record<Tab, string> = { code: 'Code', playground: 'Playground' }

export function Playground({ children, code }: PlaygroundProps) {
  const { colorMode } = useColorMode()
  const id = useId()
  const [active, setActive] = useState<Tab>('code')
  const [opened, setOpened] = useState(false)
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    code: null,
    playground: null,
  })

  function select(tab: Tab, focus = false) {
    setActive(tab)
    if (tab === 'playground') setOpened(true)
    if (focus) tabRefs.current[tab]?.focus()
  }

  return (
    <div className={styles.container}>
      <ul
        role="tablist"
        aria-label="Example view"
        className={clsx('tabs', styles.tabs)}
        data-pagefind-ignore
      >
        {TABS.map((tab, index) => (
          <li key={tab} role="presentation">
            <button
              type="button"
              role="tab"
              id={`${id}-${tab}-tab`}
              aria-controls={`${id}-${tab}-panel`}
              aria-selected={active === tab}
              tabIndex={active === tab ? 0 : -1}
              className={clsx(
                'tabs__item',
                styles.tab,
                active === tab && 'tabs__item--active',
              )}
              ref={(element) => {
                tabRefs.current[tab] = element
              }}
              onClick={() => select(tab)}
              onKeyDown={(event) => {
                const offset =
                  event.key === 'ArrowRight'
                    ? 1
                    : event.key === 'ArrowLeft'
                      ? -1
                      : 0
                if (!offset) return
                event.preventDefault()
                select(TABS[(index + offset + TABS.length) % TABS.length], true)
              }}
            >
              {LABELS[tab]}
            </button>
          </li>
        ))}
      </ul>
      <div
        role="tabpanel"
        id={`${id}-code-panel`}
        aria-labelledby={`${id}-code-tab`}
        hidden={active !== 'code'}
      >
        {children}
      </div>
      {opened && (
        <div
          role="tabpanel"
          id={`${id}-playground-panel`}
          aria-labelledby={`${id}-playground-tab`}
          hidden={active !== 'playground'}
          data-pagefind-ignore
        >
          <iframe
            allow="clipboard-write"
            className={styles.playground}
            src={getPlaygroundUrl(code, {
              theme: colorMode,
              notheme: '1',
              open: '1',
              nomore: '1',
              nohotkey: '1',
            })}
            title="Kysely Playground"
          />
        </div>
      )}
    </div>
  )
}

interface PlaygroundProps {
  children: ReactNode
  code: string
}
