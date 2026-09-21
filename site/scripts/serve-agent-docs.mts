import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { extname } from 'pathe'
import vercel from '../vercel.json' with { type: 'json' }

// Fail if new routing features would otherwise be ignored by this CI server.
const supportedKeys = [
  'src',
  'dest',
  'headers',
  'methods',
  'has',
  'continue',
  'status',
]
const routes = vercel.routes.map((route) => {
  if (
    Object.keys(route).some((key) => !supportedKeys.includes(key)) ||
    route.has?.some((condition) => condition.type !== 'header') ||
    (route.status !== undefined && route.status !== 308)
  ) {
    throw new Error('Update the afdocs server to support the new Vercel rules')
  }

  return {
    pattern: new RegExp(route.src),
    methods: route.methods && new Set(route.methods),
    conditions: (route.has ?? []).map(({ key, value }) => ({
      key,
      pattern: new RegExp(`^(?:${value})$`),
    })),
    headers: Object.entries(route.headers).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
    dest: route.dest,
    continue: route.continue,
    status: route.status,
  }
})

const root = fileURLToPath(new URL('../build/', import.meta.url))
type Env = { Variables: { filePath: string } }
const app = new Hono<Env>()
app.use(async (c, next) => {
  const url = new URL(c.req.url)
  let pathname = url.pathname
  const headers = new Headers()

  for (const route of routes) {
    if (
      !route.pattern.test(pathname) ||
      (route.methods && !route.methods.has(c.req.method)) ||
      route.conditions.some((condition) => {
        const value = c.req.header(condition.key)
        return value === undefined || !condition.pattern.test(value)
      })
    ) {
      continue
    }

    for (const [key, value] of route.headers) {
      headers.set(key, pathname.replace(route.pattern, value))
    }
    if (route.status === 308) {
      const location = headers.get('Location')
      if (!location) {
        throw new Error('A redirect route must specify a Location header')
      }
      return c.redirect(location + url.search, 308)
    }
    if (route.dest) {
      pathname = pathname.replace(route.pattern, route.dest)
    }
    if (!route.continue) {
      break
    }
  }

  c.set('filePath', decodeURI(pathname))
  await next()
  headers.forEach((value, key) => c.header(key, value))
})

app.use(
  serveStatic<Env>({ root, rewriteRequestPath: (_, c) => c.get('filePath') }),
)
const serveHtml = serveStatic<Env>({
  root,
  rewriteRequestPath: (_, c) => `${c.get('filePath').replace(/\/$/, '')}.html`,
})
app.use((c, next) => (extname(c.get('filePath')) ? next() : serveHtml(c, next)))

serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 3000 })
