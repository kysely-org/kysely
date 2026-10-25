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

// Accumulated PostgreSQL package footprints, including pg and hard dependencies.
const packages: Package[] = [
  {
    name: 'kysely',
    label: 'Kysely',
    version: '0.29.7',
    kind: 'builder',
    packageCount: 14,
    compressedBytes: 443114,
    unpackedBytes: 2178431,
  },
  {
    name: 'knex',
    label: 'Knex',
    version: '3.3.0',
    kind: 'builder',
    packageCount: 36,
    compressedBytes: 919135,
    unpackedBytes: 3736021,
  },
  {
    name: 'drizzle-orm',
    label: 'Drizzle',
    version: '0.45.4',
    kind: 'framework',
    packageCount: 14,
    compressedBytes: 1351776,
    unpackedBytes: 10961958,
  },
  {
    name: '@prisma/client',
    label: 'Prisma 7 + CLI',
    version: '7.10.1',
    kind: 'framework',
    packageCount: 154,
    compressedBytes: 83661565,
    unpackedBytes: 285142427,
  },
  {
    name: 'typeorm',
    label: 'TypeORM',
    version: '1.1.1',
    kind: 'framework',
    packageCount: 40,
    compressedBytes: 3746288,
    unpackedBytes: 24021826,
  },
  {
    name: 'sequelize',
    label: 'Sequelize',
    version: '6.37.8',
    kind: 'framework',
    packageCount: 35,
    compressedBytes: 3166734,
    unpackedBytes: 17337652,
  },
  {
    name: '@mikro-orm/postgresql',
    label: 'MikroORM',
    version: '7.2.5',
    kind: 'framework',
    packageCount: 21,
    compressedBytes: 1124972,
    unpackedBytes: 5094994,
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
        Measured October 25, 2026. Every setup includes pg 8.23.1 and hard
        dependencies; Prisma 7 includes its CLI, client, and PostgreSQL adapter.
        Bars share a linear scale. Excludes optional dependencies, generated
        application code, and install-script downloads. These are npm package
        payloads, not application bundle sizes.
      </figcaption>
    </figure>
  )
}
