import { RefreshTokenRow } from './authentication/refresh-token.row'
import { PasswordSignInMethodRow } from './user/sign-in-method/password-sign-in-method.row'
import { SignInMethodRow } from './user/sign-in-method/sign-in-method.row'
import { UserRow } from './user/user.row'

export interface Database {
  user: UserRow
  refresh_token: RefreshTokenRow
  sign_in_method: SignInMethodRow
  password_sign_in_method: PasswordSignInMethodRow
}
