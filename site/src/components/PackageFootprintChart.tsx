import Link from '@docusaurus/Link'
import { useState } from 'react'
import styles from './PackageFootprintChart.module.css'

type Metric = 'compressedBytes' | 'unpackedBytes'
type Package = {
  name: string
  label: string
  version: string
  kind: 'builder' | 'framework'
  packageCount: number
  compressedBytes: number
  unpackedBytes: number
}

// PostgreSQL development package payloads, including library-specific tooling.
const packages: Package[] = [
  {
    name: 'kysely',
    label: 'Kysely',
    version: '0.29.7',
    kind: 'builder',
    packageCount: 40,
    compressedBytes: 1561549,
    unpackedBytes: 6374143,
  },
  {
    name: 'knex',
    label: 'Knex',
    version: '3.3.0',
    kind: 'builder',
    packageCount: 56,
    compressedBytes: 1973455,
    unpackedBytes: 8550565,
  },
  {
    name: 'drizzle-orm',
    label: 'Drizzle',
    version: '0.45.4',
    kind: 'framework',
    packageCount: 32,
    compressedBytes: 16125650,
    unpackedBytes: 53789641,
  },
  {
    name: '@prisma/client',
    label: 'Prisma',
    version: '7.10.1',
    kind: 'framework',
    packageCount: 155,
    compressedBytes: 83668810,
    unpackedBytes: 285168128,
  },
  {
    name: 'typeorm',
    label: 'TypeORM',
    version: '1.1.1',
    kind: 'framework',
    packageCount: 60,
    compressedBytes: 4800608,
    unpackedBytes: 28836370,
  },
  {
    name: 'sequelize',
    label: 'Sequelize',
    version: '6.37.8',
    kind: 'framework',
    packageCount: 104,
    compressedBytes: 4663662,
    unpackedBytes: 24272447,
  },
  {
    name: '@mikro-orm/postgresql',
    label: 'MikroORM',
    version: '7.2.5',
    kind: 'framework',
    packageCount: 42,
    compressedBytes: 1759919,
    unpackedBytes: 7660755,
  },
]

function formatSize(bytes: number) {
  return bytes >= 1024 ** 2
    ? `${(bytes / 1024 ** 2).toFixed(2)} MiB`
    : `${(bytes / 1024).toFixed(1)} KiB`
}

export function PackageFootprintChart() {
  const [metric, setMetric] = useState<Metric>('compressedBytes')
  const ordered = [...packages].sort((a, b) => a[metric] - b[metric])
  const maximum = Math.max(...ordered.map((entry) => entry[metric]))

  return (
    <figure
      className={styles.figure}
      aria-label="PostgreSQL package footprints"
    >
      <div className={styles.header}>
        <label className={styles.control}>
          Show
          <select
            aria-label="PostgreSQL footprint metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as Metric)}
          >
            <option value="compressedBytes">Compressed downloads</option>
            <option value="unpackedBytes">Unpacked packages</option>
          </select>
        </label>
        <div className={styles.legend}>
          <span>
            <i className={styles.builder} />
            Query builders
          </span>
          <span>
            <i className={styles.framework} />
            Data frameworks
          </span>
        </div>
      </div>
      <div className={styles.axis} aria-hidden="true">
        <span>0</span>
        <span>{formatSize(maximum)}</span>
      </div>
      <ol className={styles.rows}>
        {ordered.map((entry) => (
          <li key={entry.name} data-package={entry.name}>
            <div className={styles.rowTop}>
              <div className={styles.label}>
                <Link
                  to={`https://www.npmjs.com/package/${entry.name}/v/${entry.version}`}
                >
                  {entry.label}
                </Link>
                <span className={styles.version}>
                  {entry.version} · {entry.packageCount} packages
                </span>
              </div>
              <span className={styles.size}>{formatSize(entry[metric])}</span>
            </div>
            <div className={styles.track} aria-hidden="true">
              <span
                className={`${styles.bar} ${styles[entry.kind]}`}
                style={{ width: `${(entry[metric] / maximum) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
      <figcaption className={styles.caption}>
        Measured October 25, 2026 on macOS arm64. Includes pg 8.23.1, each
        setup's schema/migration/generation tools, and installed transitive
        dependencies. Bars share a linear scale. These are npm package payloads,
        excluding shared Node.js/TypeScript tools, generated application files,
        and install-script downloads.
      </figcaption>
    </figure>
  )
}
