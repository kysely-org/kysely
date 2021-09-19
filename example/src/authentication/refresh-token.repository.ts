import { Kysely } from 'kysely'
import { Database } from '../database'
import { RefreshTokenRow } from './refresh-token.row'

async function insertRefreshToken(
  db: Kysely<Database>,
  userId: string
): Promise<RefreshTokenRow> {
  const [refreshToken] = await db
    .insertInto('refresh_token')
    .values({
      user_id: userId,
      last_refreshed_at: new Date(),
    })
    .returningAll()
    .execute()

  return refreshToken
}

async function findRefreshToken(
  db: Kysely<Database>,
  userId: string,
  refreshTokenId: string
): Promise<RefreshTokenRow | undefined> {
  const token = await db
    .selectFrom('refresh_token as rt')
    .selectAll('rt')
    .innerJoin('user as u', 'rt.user_id', 'u.user_id')
    .where('u.user_id', '=', userId)
    .where('rt.refresh_token_id', '=', refreshTokenId)
    .executeTakeFirst()

  return token
}

export const refreshTokenRepository = Object.freeze({
  insertRefreshToken,
  findRefreshToken,
})
