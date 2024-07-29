import { Generated, Insertable, Selectable, Updatable } from 'kysely'

export interface RefreshTokenTable {
  refresh_token_id: Generated<string>
  user_id: string
  last_refreshed_at: Date
  created_at: Generated<Date>
}

export type RefreshTokenRow = Selectable<RefreshTokenTable>
export type InsertableRefreshTokenRow = Insertable<RefreshTokenTable>
export type UpdatableRefreshTokenRow = Updatable<RefreshTokenTable>
