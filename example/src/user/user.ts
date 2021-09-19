import { ajv } from '../util/ajv'

export interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
}

export interface CreateAnonymousUserRequest {
  firstName?: string
  lastName?: string
}

export const validateCreateAnonymousUserRequest =
  ajv.compile<CreateAnonymousUserRequest>({
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
      },
      lastName: {
        type: 'string',
      },
    },
  })
