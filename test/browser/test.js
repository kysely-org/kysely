/**
 * Super simple smoke test that just opens an empty web page
 * and runs the `main.ts` script in it (bundled with esbuild).
 * The script builds a query and writes the result to a span
 * in the browser.
 */

const path = require('path')
const { chromium } = require('playwright')

const EXPECTED_SQL = 'select "id" from "person"'

;(async () => {
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto('file://' + path.join(__dirname, 'index.html'))
    // Wait until the main.ts script has finished and the result
    // span exists in the body.
    await page.waitForSelector('#result', { timeout: 5000 })
    const sql = await page.$eval('#result', (el) => el.innerHTML)

    if (sql !== EXPECTED_SQL) {
      throw new Error(`failed to build a query`)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await browser?.close()
  }

  console.log('browser test passed')
})()
