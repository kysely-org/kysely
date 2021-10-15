import { AuthToken } from '../authentication/auth-token'
import { RefreshToken } from '../authentication/refresh-token'
import { User } from './user'

export interface SignedInUser {
  refreshToken: RefreshToken
  authToken: AuthToken
  user: User
}
