import { serve } from '@hono/node-server'
import { config } from './config.js'
import { createDb } from './db.js'
import { createApp } from './app.js'

const db = createDb()
const app = createApp(db)

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`listening on http://localhost:${info.port}`)
})
