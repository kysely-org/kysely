import { Insertable, Selectable, Updatable } from 'kysely'

export interface SignInMethodTable {
  user_id: string
  type: 'password'
}

export type SignInMethodRow = Selectable<SignInMethodTable>
export type InsertableSignInMethodRow = Insertable<SignInMethodTable>
export type UpdatableSignInMethodRow = Updatable<SignInMethodTable>
