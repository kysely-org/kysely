import { Insertable, Selectable, Updatable } from 'kysely'

export interface PasswordSignInMethodTable {
  user_id: string
  password_hash: string
}

export type PasswordSignInMethodRow = Selectable<PasswordSignInMethodTable>

export type InsertablePasswordSignInMethodRow =
  Insertable<PasswordSignInMethodTable>

export type UpdatablePasswordSignInMethodRow =
  Updatable<PasswordSignInMethodTable>
