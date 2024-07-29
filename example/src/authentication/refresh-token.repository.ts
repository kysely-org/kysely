import { Kysely } from 'kysely'
import { Database } from '../database'
import {
  RefreshTokenRow,
  UpdatableRefreshTokenRow,
} from './refresh-token.table'

export async function insertRefreshToken(
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

export async function findRefreshToken(
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

export async function updateRefreshToken(
  db: Kysely<Database>,
  refreshTokenId: string,
  patch: Pick<UpdatableRefreshTokenRow, 'last_refreshed_at'>
): Promise<void> {
  await db
    .updateTable('refresh_token')
    .set(patch)
    .where('refresh_token_id', '=', refreshTokenId)
    .execute()
}
