import { useColorMode } from '@docusaurus/theme-common'
import { useEffect, useState } from 'react'
import styles from './Playground.module.css'

export function Playground(props: PlaygroundProps) {
  const src = useSrc(props)

  return (
    <iframe
      allow="clipboard-write"
      autoFocus
      className={styles.playground}
      src={src}
    />
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
    editors: { query: props.code, type: props.setupCode || exampleSetup },
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

export const exampleSetup = `import { Generated } from 'kysely'

export interface Database {
  person: PersonTable
  pet: PetTable
}

interface PersonTable {
  id: Generated<string>
  first_name: string
  last_name: string | null
  created_at: Generated<Date>
  age: number
  has_pets: Generated<'Y' | 'N'>
}

interface PetTable {
  id: Generated<string>
  name: string
  owner_id: string
  species: 'cat' | 'dog'
  is_favorite: boolean
}
`
