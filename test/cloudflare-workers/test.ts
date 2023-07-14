import { unstable_dev } from 'wrangler'
;(async () => {
  const worker = await unstable_dev('./api.ts', {
    compatibilityDate: '2023-06-28',
    experimental: { disableExperimentalWarning: true },
    local: true,
    // logLevel: 'debug',
    nodeCompat: true,
    vars: {
      NAME: 'cloudflare',
    },
  })

  let exitCode = 0

  try {
    const response = await worker.fetch('/')

    if (!response.ok) {
      throw new Error(`Unexpected response: ${response.status}`)
    }

    console.log('test successful!')
  } catch (error) {
    exitCode = 1
  } finally {
    await worker.stop()
    process.exit(exitCode)
  }
})()
