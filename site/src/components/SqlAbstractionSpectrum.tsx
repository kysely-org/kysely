import Link from '@docusaurus/Link'
import styles from './SqlAbstractionSpectrum.module.css'

type Library = { name: string; href: string; shipsKysely?: boolean }

const regions: { libraries: Library[]; description: string }[] = [
  {
    libraries: [{ name: 'Kysely', href: '/docs/getting-started' }],
    description: 'SQL query builder',
  },
  {
    libraries: [
      { name: 'Knex', href: 'https://knexjs.org/guide/query-builder.html' },
      { name: 'Zapatos', href: 'https://jawj.github.io/zapatos/' },
    ],
    description: 'Query building with magic',
  },
  {
    libraries: [
      { name: 'Drizzle', href: 'https://orm.drizzle.team/docs/overview' },
      {
        name: 'MikroORM 7',
        href: 'https://mikro-orm.io/docs/kysely',
        shipsKysely: true,
      },
      {
        name: 'ZenStack 3',
        href: 'https://zenstack.dev/docs/orm/query-builder',
        shipsKysely: true,
      },
    ],
    description: 'Query builder + ORM',
  },
  {
    libraries: [
      {
        name: 'TypeORM',
        href: 'https://typeorm.io/docs/query-builder/select-query-builder/',
      },
      {
        name: 'Objection.js',
        href: 'https://vincit.github.io/objection.js/api/query-builder/',
      },
    ],
    description: 'ORM with an entity-oriented query builder',
  },
  {
    libraries: [
      { name: 'Prisma 7', href: 'https://www.prisma.io/docs/orm/v7' },
      {
        name: 'Sequelize',
        href: 'https://sequelize.org/docs/v6/core-concepts/model-instances/',
      },
    ],
    description: 'ORM',
  },
]

export function SqlAbstractionSpectrum() {
  return (
    <figure
      className={styles.figure}
      aria-label="SQL query builder to ORM spectrum"
    >
      <div className={styles.axis}>
        <span>SQL query builder</span>
        <span className={styles.line} aria-hidden="true" />
        <span>ORM</span>
      </div>
      <ol className={styles.regions}>
        {regions.map(({ libraries, description }) => (
          <li key={libraries[0].name} className={styles.region}>
            <div className={styles.libraries}>
              {libraries.map(({ name, href, shipsKysely }) => (
                <Link key={name} to={href}>
                  {name}
                  {shipsKysely && (
                    <>
                      {' '}
                      <span role="img" aria-label="ships Kysely">
                        ❤️
                      </span>
                    </>
                  )}
                </Link>
              ))}
            </div>
            <span className={styles.description}>{description}</span>
          </li>
        ))}
      </ol>
      <figcaption className={styles.caption}>
        Approximate ecosystem overview. The middle combines query builders with
        ORM APIs. <span aria-hidden="true">❤️</span> = ships Kysely.
      </figcaption>
    </figure>
  )
}
