import { useColorMode } from '@docusaurus/theme-common'
import { useEffect, useRef, useState } from 'react'
import styles from './Playground.module.css'
import { GENERATED_PLAYGROUND_EXAMPLE_TYPES } from './playground-example-types'
import clsx from 'clsx'
import CodeBlock from '@theme/CodeBlock'

export function Playground(props: PlaygroundProps) {
  const src = useSrc(props)
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const { current: iframe } = iframeRef

    if (!iframe) {
      return
    }

    let failTimer: NodeJS.Timeout

    const handleLoad = () => {
      clearTimeout(failTimer)
    }

    iframe.addEventListener('load', handleLoad)

    failTimer = setTimeout(() => {
      setLoadFailed(true)
    }, 2_000)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      clearTimeout(failTimer)
    }
  }, [src])

  return (
    <>
      {!loadFailed && (
        <iframe
          allow="clipboard-write"
          autoFocus
          className={styles.playground}
          ref={iframeRef}
          src={src}
        />
      )}
      <div
        className={clsx(
          'code-example',
          !loadFailed ? styles.visuallyHidden : undefined,
        )}
      >
        <CodeBlock language="ts">
          {[GENERATED_PLAYGROUND_EXAMPLE_TYPES, props.setupCode, props.code]
            .filter(Boolean)
            .join('\n\n')}
        </CodeBlock>
      </div>
    </>
  )
}

function useSrc(props: PlaygroundProps) {
  const { colorMode } = useColorMode()
  const [src, setSrc] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()

    params.set('theme', colorMode)
    params.set('notheme', '1')

    if (!props.disableIframeMode) {
      params.set('open', '1')
      params.set('nomore', '1')
      params.set('nohotkey', '1')
    }

    setSrc(`https://kyse.link/?${params}${getPlaygroundStateHash(props)}`)
  }, [colorMode])

  return src
}

function getPlaygroundStateHash(props: PlaygroundProps) {
  const { kyselyVersion } = props

  const state: PlaygroundState = {
    dialect: props.dialect || 'postgres',
    editors: { query: props.code, type: GENERATED_PLAYGROUND_EXAMPLE_TYPES },
    hideType: true,
  }

  if (kyselyVersion) {
    state.kysely = { type: 'tag', name: kyselyVersion }
  }

  return '#r' + encodeURIComponent(JSON.stringify(state))
}

interface PlaygroundProps {
  kyselyVersion?: string
  dialect?: 'postgres'
  code: string
  setupCode?: string
  disableIframeMode: boolean
}

interface PlaygroundState {
  dialect: 'postgres' | 'mysql' | 'mssql' | 'sqlite'
  editors: {
    type: string
    query: string
  }
  hideType?: boolean
  kysely?: {
    type: 'tag' | 'branch'
    name: string
  }
}
