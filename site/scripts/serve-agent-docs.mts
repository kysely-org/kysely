import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { extname } from 'pathe'
import vercel from '../vercel.json' with { type: 'json' }

const { routes } = vercel

// Fail if new routing features would otherwise be ignored by this CI server.
const supportedKeys = ['src', 'dest', 'headers', 'methods', 'has', 'continue']
for (const route of routes) {
  if (
    Object.keys(route).some((key) => !supportedKeys.includes(key)) ||
    route.has?.some((condition) => condition.type !== 'header')
  ) {
    throw new Error('Update the afdocs server to support the new Vercel rules')
  }
}

const root = fileURLToPath(new URL('../build/', import.meta.url))
const app = new Hono()
app.use('*', serveStatic({ root }))
const serveHtml = serveStatic({
  root,
  rewriteRequestPath: (path) => `${path.replace(/\/$/, '')}.html`,
})
app.use('*', (c, next) => (extname(c.req.path) ? next() : serveHtml(c, next)))

serve({
  hostname: '127.0.0.1',
  port: 3000,
  fetch: async (request) => {
    const url = new URL(request.url)
    const headers = new Headers()

    for (const route of routes) {
      const pattern = new RegExp(route.src)
      if (
        !pattern.test(url.pathname) ||
        (route.methods && !route.methods.includes(request.method)) ||
        route.has?.some((condition) => {
          const value = request.headers.get(condition.key)
          return (
            value === null ||
            !new RegExp(`^(?:${condition.value})$`).test(value)
          )
        })
      ) {
        continue
      }

      for (const [key, value] of Object.entries(route.headers)) {
        if (value !== undefined) headers.set(key, value)
      }
      if (route.dest) {
        url.pathname = url.pathname.replace(pattern, route.dest)
      }
      if (!route.continue) {
        break
      }
    }

    const response = await app.fetch(new Request(url, request))
    headers.forEach((value, key) => response.headers.set(key, value))
    return response
  },
})
