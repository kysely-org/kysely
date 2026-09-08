import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
    typecheck: {
      enabled: true,
      only: true,
      // Avoid Vitest's shared incremental cache and honor the tsconfig setting.
      build: true,
      include: ['test/typings/vitest/**/*.test-d.ts'],
      tsconfig: './test/typings/tsconfig.vitest.json',
    },
  },
})
