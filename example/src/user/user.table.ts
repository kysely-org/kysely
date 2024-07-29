import { Generated, Insertable, Selectable, Updatable } from 'kysely'

export interface UserTable {
  user_id: Generated<string>
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at: Generated<Date>
}

export type UserRow = Selectable<UserTable>
export type InsertableUserRow = Insertable<UserTable>
export type UpdatableUserRow = Updatable<UserTable>
