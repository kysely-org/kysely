import { GENERATED_PLAYGROUND_EXAMPLE_TYPES } from './playground-example-types'

export function getPlaygroundUrl(code: string) {
  const state = {
    dialect: 'postgres',
    editors: { query: code, type: GENERATED_PLAYGROUND_EXAMPLE_TYPES },
    hideType: true,
  }
  return (
    'https://play.kysely.dev/#r' + encodeURIComponent(JSON.stringify(state))
  )
}
