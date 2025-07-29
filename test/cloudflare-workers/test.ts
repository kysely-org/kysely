import { unstable_dev } from 'wrangler'
;(async () => {
  const worker = await unstable_dev('./api.ts', {
    compatibilityDate: '2025-07-29',
    compatibilityFlags: ['nodejs_compat'],
    local: true,
  })

  let exitCode = 0

  try {
    const response = await worker.fetch('http://example.com')

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
