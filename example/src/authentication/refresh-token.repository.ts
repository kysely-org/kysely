import { Kysely } from 'kysely'
import { Database } from '../database'
import { RefreshTokenRow } from './refresh-token.row'

async function insertRefreshToken(
  db: Kysely<Database>,
  userId: string
): Promise<RefreshTokenRow> {
  const [refreshToken] = await db
    .insertInto('refresh_token')
    .values({ user_id: userId })
    .returningAll()
    .execute()

  return refreshToken
}

export const refreshTokenRepository = Object.freeze({
  insertRefreshToken,
})
