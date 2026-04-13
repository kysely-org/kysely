import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Kysely } from 'kysely'
import type { Database } from '../src/database.js'
import { createApp } from '../src/app.js'
import { createTestDb } from './setup.js'
import { signToken } from '../src/middleware/auth.js'

let db: Kysely<Database>
let app: ReturnType<typeof createApp>
let token: string

beforeAll(async () => {
  db = await createTestDb()
  app = createApp(db)
  token = await signToken('test-user')
})

afterAll(async () => {
  await db.destroy()
})

describe('POST /customers', () => {
  it('creates a customer', async () => {
    const res = await app.request('/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Alfreds Futterkiste',
        email: 'alfred@example.com',
        city: 'Berlin',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({
      name: 'Alfreds Futterkiste',
      email: 'alfred@example.com',
      city: 'Berlin',
    })
    expect(body.id).toBeDefined()
  })

  it('rejects invalid input', async () => {
    const res = await app.request('/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: '' }),
    })

    expect(res.status).toBe(400)
  })
})

describe('GET /customers', () => {
  it('lists customers', async () => {
    const res = await app.request('/customers', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })
})

describe('GET /customers/:id', () => {
  it('returns 404 for non-existent customer', async () => {
    const res = await app.request('/customers/99999', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(404)
  })
})

describe('authentication', () => {
  it('rejects requests without a token', async () => {
    const res = await app.request('/customers')
    expect(res.status).toBe(401)
  })
})
