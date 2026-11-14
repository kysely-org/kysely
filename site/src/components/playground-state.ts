import { GENERATED_PLAYGROUND_EXAMPLE_TYPES } from './playground-example-types'

export function getPlaygroundUrl(
  code: string,
  params: Record<string, string> = {},
) {
  const state = {
    dialect: 'postgres',
    editors: { query: code, type: GENERATED_PLAYGROUND_EXAMPLE_TYPES },
    hideType: true,
  }
  const search = new URLSearchParams(params).toString()
  return (
    `https://play.kysely.dev/${search ? `?${search}` : ''}#r` +
    encodeURIComponent(JSON.stringify(state))
  )
}
