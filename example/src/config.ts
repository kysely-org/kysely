function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`missing environment variable: ${name}`)
  }
  return value
}

export const config = Object.freeze({
  port: Number(env('PORT', '3000')),
  authSecret: env('AUTH_SECRET', 'dev-secret'),
  database: Object.freeze({
    host: env('DATABASE_HOST', 'localhost'),
    port: Number(env('DATABASE_PORT', '5432')),
    user: env('DATABASE_USER', 'postgres'),
    password: env('DATABASE_PASSWORD', 'postgres'),
    database: env('DATABASE_NAME', 'northwind'),
  }),
})

export type Config = typeof config
