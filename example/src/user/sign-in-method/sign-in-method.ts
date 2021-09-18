import { ajv } from '../../util/ajv'

export type SignInMethod = PasswordSignInMethod

export interface PasswordSignInMethod {
  email: string
  password: string
}

export const validatePasswordSignInMethod = ajv.compile<PasswordSignInMethod>({
  type: 'object',
  properties: {
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
  },
})
