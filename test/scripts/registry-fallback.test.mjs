import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

const exec = promisify(execFile)
const digest = (body) =>
  `sha256:${createHash('sha256').update(body).digest('hex')}`

test(
  'Docker registry fallbacks',
  { skip: process.platform !== 'linux' },
  async (t) => {
    const source = await readFile(
      new URL(
        '../../.github/actions/start-test-databases/hosts.toml',
        import.meta.url,
      ),
      'utf8',
    )
    const namespace = `kysely-fallback-${randomUUID()}.invalid`
    const hostsDirectory = `/etc/docker/certs.d/${namespace}`
    const hostsFile = `${hostsDirectory}/hosts.toml`
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'kysely-fallback-'))
    const requests = []
    const servers = []
    let scenario

    try {
      let configuration = source

      for (const [name, upstream, prefix] of [
        ['google', 'https://mirror.gcr.io', '/v2'],
        ['aws', 'https://public.ecr.aws', '/v2/docker'],
        ['hub', 'https://registry-1.docker.io', '/v2'],
      ]) {
        const server = createServer((request, response) => {
          const path = new URL(request.url, 'http://localhost').pathname
          response.setHeader('Docker-Distribution-Api-Version', 'registry/2.0')

          if (path === '/v2/' || path === '/v2') {
            response.end('{}')
            return
          }

          if (path.includes('/manifests/')) {
            requests.push({ name, path })
          }

          const status = scenario.statuses[name]
          if (status !== 200) {
            response.writeHead(status, { 'Content-Type': 'application/json' })
            response.end(
              JSON.stringify({
                errors: [
                  {
                    code:
                      status === 429 ? 'TOOMANYREQUESTS' : 'MANIFEST_UNKNOWN',
                    message: `test registry response: ${status}`,
                  },
                ],
              }),
            )
            return
          }

          let body
          let mediaType
          if (
            path.startsWith(
              `${prefix}/library/kysely-fallback-probe/manifests/`,
            )
          ) {
            body = scenario.manifest
            mediaType = 'application/vnd.oci.image.manifest.v1+json'
          } else if (
            path ===
            `${prefix}/library/kysely-fallback-probe/blobs/${digest(scenario.config)}`
          ) {
            body = scenario.config
            mediaType = 'application/vnd.oci.image.config.v1+json'
          } else {
            response.writeHead(404)
            response.end()
            return
          }

          response.writeHead(200, {
            'Content-Type': mediaType,
            'Content-Length': Buffer.byteLength(body),
            'Docker-Content-Digest': digest(body),
          })
          response.end(request.method === 'HEAD' ? undefined : body)
        })

        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
        servers.push(server)
        assert.ok(configuration.includes(upstream))
        configuration = configuration.replaceAll(
          upstream,
          `http://127.0.0.1:${server.address().port}`,
        )
      }

      const configurationFile = join(temporaryDirectory, 'hosts.toml')
      await writeFile(configurationFile, configuration)
      await exec('sudo', [
        'install',
        '-D',
        '-m',
        '0644',
        configurationFile,
        hostsFile,
      ])

      for (const [name, statuses, expectedHosts, succeeds] of [
        ['google-hit', { google: 200, aws: 200, hub: 200 }, ['google'], true],
        [
          'google-throttled',
          { google: 429, aws: 200, hub: 200 },
          ['google', 'aws'],
          true,
        ],
        [
          'hub-fallback',
          { google: 404, aws: 429, hub: 200 },
          ['google', 'aws', 'hub'],
          true,
        ],
        [
          'all-throttled',
          { google: 429, aws: 429, hub: 429 },
          ['google', 'aws', 'hub'],
          false,
        ],
      ]) {
        await t.test(name, { timeout: 120_000 }, async () => {
          requests.length = 0
          const config = JSON.stringify({
            architecture: process.arch === 'x64' ? 'amd64' : process.arch,
            os: 'linux',
            config: { Labels: { scenario: name } },
            rootfs: { type: 'layers', diff_ids: [] },
          })
          scenario = {
            statuses,
            config,
            manifest: JSON.stringify({
              schemaVersion: 2,
              mediaType: 'application/vnd.oci.image.manifest.v1+json',
              config: {
                mediaType: 'application/vnd.oci.image.config.v1+json',
                digest: digest(config),
                size: Buffer.byteLength(config),
              },
              layers: [],
            }),
          }

          const pull = exec(
            'docker',
            ['pull', `${namespace}/library/kysely-fallback-probe:${name}`],
            { timeout: 110_000 },
          )
          if (succeeds) {
            await pull
          } else {
            await assert.rejects(pull, /429|TOOMANYREQUESTS|Too Many Requests/)
          }

          assert.deepEqual(
            [...new Set(requests.map(({ name }) => name))],
            expectedHosts,
          )
          if (expectedHosts.includes('aws')) {
            assert.ok(
              requests.some(
                ({ name, path }) =>
                  name === 'aws' &&
                  path.startsWith(
                    '/v2/docker/library/kysely-fallback-probe/manifests/',
                  ),
              ),
            )
          }
        })
      }
    } finally {
      await Promise.all(
        servers.map(
          (server) => new Promise((resolve) => server.close(resolve)),
        ),
      )
      await exec('sudo', ['rm', '-f', '--', hostsFile])
      await exec('sudo', [
        'rmdir',
        '--ignore-fail-on-non-empty',
        '--',
        hostsDirectory,
      ])
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  },
)
