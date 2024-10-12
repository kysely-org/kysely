import { useColorMode } from '../hooks/use-color-mode'
import styles from './Playground.module.css'

export function Playground(props: PlaygroundProps) {
  const params = usePlaygroundParams(props.disableIframeMode)

  console.log('hi!')

  return (
    <iframe
      allow="clipboard-write"
      className={styles.playground}
      src={`https://kyse.link/?${params}${getPlaygroundStateHash(props)}`}
    />
  )
}

function usePlaygroundParams(disableIframeMode: boolean) {
  const { colorMode } = useColorMode()

  const params = new URLSearchParams()

  params.set('theme', colorMode)

  if (!disableIframeMode) {
    params.set('open', '1')
    params.set('nomore', '1')
    // params.set('notheme', '1')
    params.set('nohotkey', '1')
  }

  return params
}

function getPlaygroundStateHash(props: PlaygroundProps) {
  const { kyselyVersion } = props

  const state: PlaygroundState = {
    dialect: props.dialect || 'postgres',
    editors: { query: props.code, type: props.setupCode },
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
}

interface PetTable {
  id: Generated<string>
  name: string
  owner_id: string
  species: 'cat' | 'dog'
  is_favorite: boolean
}
`

export const exampleFilterById = `const person = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where('id', '=', '1')
  .executeTakeFirst()
`
