import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono, type MiddlewareHandler } from 'hono'
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
let filesystemPhase = false
const routes = vercel.routes.flatMap((route) => {
  if ('handle' in route) {
    if (route.handle !== 'filesystem' || Object.keys(route).length !== 1) {
      throw new Error(
        'Update the afdocs server to support the new Vercel phase',
      )
    }
    filesystemPhase = true
    return []
  }

  if (
    Object.keys(route).some((key) => !supportedKeys.includes(key)) ||
    route.has?.some((condition) => condition.type !== 'header') ||
    (route.status !== undefined && route.status !== 404)
  ) {
    throw new Error('Update the afdocs server to support the new Vercel rules')
  }

  return {
    filesystemPhase,
    status: route.status === 404 ? (404 as const) : undefined,
    pattern: new RegExp(route.src),
    methods: route.methods && new Set(route.methods),
    conditions: (route.has ?? []).map(({ key, value }) => ({
      key,
      pattern: new RegExp(`^(?:${value})$`),
    })),
    headers: Object.entries(route.headers ?? {}).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
    dest: route.dest,
    continue: route.continue,
  }
})

const root = fileURLToPath(new URL('../build/', import.meta.url))
type Env = { Variables: { filePath: string; routeHeaders: Headers } }
const app = new Hono<Env>()
function applyRoutes(filesystemPhase: boolean): MiddlewareHandler<Env> {
  return async (c, next) => {
    let pathname = filesystemPhase ? c.get('filePath') : c.req.path
    const headers = filesystemPhase ? c.get('routeHeaders') : new Headers()
    let status: 404 | undefined

    for (const route of routes) {
      if (
        route.filesystemPhase !== filesystemPhase ||
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
        headers.set(key, value)
      }
      if (route.dest) {
        pathname = pathname.replace(route.pattern, route.dest)
      }
      status = route.status ?? status
      if (!route.continue) {
        break
      }
    }

    c.set('filePath', decodeURI(pathname))
    c.set('routeHeaders', headers)
    await next()
    if (status) {
      c.res = new Response(c.res.body, { status, headers: c.res.headers })
    }
    headers.forEach((value, key) => c.header(key, value))
  }
}

const serveFile = serveStatic<Env>({
  root,
  rewriteRequestPath: (_, c) => c.get('filePath'),
})
app.use(applyRoutes(false))
app.use(serveFile)
const serveHtml = serveStatic<Env>({
  root,
  rewriteRequestPath: (_, c) => `${c.get('filePath').replace(/\/$/, '')}.html`,
})
app.use((c, next) => (extname(c.get('filePath')) ? next() : serveHtml(c, next)))
// Only a filesystem miss reaches these fallback routes.
app.use(applyRoutes(true))
app.use(serveFile)

serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 3000 })
