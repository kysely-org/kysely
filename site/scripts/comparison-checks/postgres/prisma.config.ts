import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './schema.prisma',
  typedSql: { path: './sql' },
  datasource: { url: process.env.RAW_COMPARISON_DATABASE_URL },
})
