import Link from '@docusaurus/Link'
import { useState } from 'react'
import styles from './PackageFootprintChart.module.css'

type Metric = 'tarballBytes' | 'unpackedBytes'
type Package = {
  name: string
  label: string
  version: string
  kind: 'builder' | 'framework'
  tarballBytes: number
  unpackedBytes: number
}

// Published npm tarballs measured October 24–25, 2026.
const packages: Package[] = [
  {
    name: 'kysely',
    label: 'Kysely',
    version: '0.29.7',
    kind: 'builder',
    tarballBytes: 325969,
    unpackedBytes: 1734447,
  },
  {
    name: 'knex',
    label: 'Knex',
    version: '3.3.0',
    kind: 'builder',
    tarballBytes: 220501,
    unpackedBytes: 941393,
  },
  {
    name: 'drizzle-orm',
    label: 'Drizzle',
    version: '0.45.4',
    kind: 'framework',
    tarballBytes: 1234631,
    unpackedBytes: 10517974,
  },
  {
    name: '@prisma/client',
    label: 'Prisma Client',
    version: '7.10.1',
    kind: 'framework',
    tarballBytes: 26828672,
    unpackedBytes: 74458622,
  },
  {
    name: 'typeorm',
    label: 'TypeORM',
    version: '1.1.1',
    kind: 'framework',
    tarballBytes: 3200022,
    unpackedBytes: 21667474,
  },
  {
    name: 'sequelize',
    label: 'Sequelize',
    version: '6.37.8',
    kind: 'framework',
    tarballBytes: 608337,
    unpackedBytes: 2909753,
  },
  {
    name: '@mikro-orm/core',
    label: 'MikroORM core',
    version: '7.2.5',
    kind: 'framework',
    tarballBytes: 397089,
    unpackedBytes: 1705531,
  },
]

function formatSize(bytes: number) {
  return bytes >= 1024 ** 2
    ? `${(bytes / 1024 ** 2).toFixed(2)} MiB`
    : `${(bytes / 1024).toFixed(1)} KiB`
}

export function PackageFootprintChart() {
  const [metric, setMetric] = useState<Metric>('tarballBytes')
  const ordered = [...packages].sort((a, b) => a[metric] - b[metric])
  const maximum = Math.max(...ordered.map((entry) => entry[metric]))

  return (
    <figure className={styles.figure} aria-label="Published package sizes">
      <div className={styles.header}>
        <label className={styles.control}>
          Show
          <select
            aria-label="Package size metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as Metric)}
          >
            <option value="tarballBytes">Compressed download</option>
            <option value="unpackedBytes">Unpacked size</option>
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
                <span className={styles.version}>{entry.version}</span>
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
        Measured October 24–25, 2026 from published npm tarballs. All bars use
        the same linear scale. Library packages only: excludes dependencies,
        drivers, generated client code, and separate CLIs. Package size does not
        measure application bundle size.
      </figcaption>
    </figure>
  )
}
