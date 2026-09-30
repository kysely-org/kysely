import assert from 'node:assert/strict'

// Accept a deployment URL too, so the same checks can verify Vercel routing.
const origin = process.argv[2] ?? 'http://127.0.0.1:3000'
const missingPaths = [
  '/__ora-404-probe-q7uz47qs',
  '/some-path-that-does-not-exist',
  '/some-path-that-does-not-exist/',
  '/docs/some-path-that-does-not-exist',
  '/docs/some-path-that-does-not-exist/',
  '/docs/some-path-that-does-not-exist.md',
  '/assets/some-file-that-does-not-exist.js',
]

for (const path of missingPaths) {
  for (const accept of ['text/markdown', 'text/html']) {
    const response = await fetch(new URL(path, origin), {
      headers: { Accept: accept },
      redirect: 'follow',
    })
    const label = `${path} (Accept: ${accept})`
    const body = await response.text()

    assert.equal(response.status, 404, `${label}: final HTTP status`)
    assert.equal(
      response.headers.get('content-type')?.split(';')[0],
      accept,
      `${label}: content type`,
    )
    assert.match(response.headers.get('vary') ?? '', /\baccept\b/i, label)

    if (accept === 'text/markdown') {
      const explanation = body
        .replace(/^#.*$/gm, '')
        .replace(/\[[^\]]+\]\([^)]*\)/g, '')
        .trim()
      assert.ok(explanation.length >= 20, `${label}: explanatory error body`)
      assert.match(body, /^# .*404.*not found/im, label)
      assert.match(explanation, /not found|does not exist|moved/i, label)
      assert.match(
        body,
        /\[[^\]]+\]\(https:\/\/kysely\.dev\/(?:llms\.txt|sitemap\.xml|docs[^)]*)\)/,
        `${label}: documentation recovery link`,
      )
      assert.doesNotMatch(body, /<!doctype html|<html\b/i, label)
    } else {
      assert.match(body, /<!doctype html|<html\b/i, label)
    }
    console.log(`PASS ${label}: 404 with ${accept} error body`)
  }

  const head = await fetch(new URL(path, origin), {
    method: 'HEAD',
    headers: { Accept: 'text/markdown' },
    redirect: 'follow',
  })
  assert.equal(head.status, 404, `${path}: HEAD status`)
  assert.equal(head.headers.get('content-type')?.split(';')[0], 'text/markdown')
  assert.equal(await head.text(), '', `${path}: HEAD must not include a body`)

  const browser = await fetch(new URL(path, origin))
  assert.equal(browser.status, 404, `${path}: default HTML error status`)
  assert.equal(browser.headers.get('content-type')?.split(';')[0], 'text/html')
  assert.match(await browser.text(), /<!doctype html|<html\b/i)
}

// Error routes must not intercept valid pages or their Markdown rewrites.
for (const path of ['/', '/index.html', '/docs/plugins']) {
  for (const accept of ['text/markdown', 'text/html']) {
    const response = await fetch(new URL(path, origin), {
      headers: { Accept: accept },
    })
    assert.equal(response.status, 200, `${path} (${accept}): existing page`)
    assert.equal(response.headers.get('content-type')?.split(';')[0], accept)
    await response.body?.cancel()
  }
}

// Files must be served before the fallback, regardless of the Accept header.
for (const [path, type, content] of [
  ['/index.md', 'text/markdown', /^# /m],
  ['/docs/plugins.md', 'text/markdown', /^# /m],
  ['/llms.txt', 'text/plain', /^# /m],
  ['/llms-full.txt', 'text/plain', /^# /m],
  ['/robots.txt', 'text/plain', /^User-agent: \*/m],
  ['/sitemap.xml', '(?:application|text)/xml', /<urlset\b/],
] as const) {
  const response = await fetch(new URL(path, origin), {
    headers: { Accept: 'text/markdown' },
  })
  assert.equal(response.status, 200, `${path}: existing file`)
  assert.match(
    response.headers.get('content-type') ?? '',
    new RegExp(`^${type}(?:;|$)`),
  )
  assert.match(await response.text(), content, `${path}: file content`)
  console.log(`PASS ${path}: existing machine-readable file`)
}
