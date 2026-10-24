import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './SqlAbstractionSpectrum.module.css'

type Library = { name: string; href: string; builder?: 'Kysely' | 'Knex' }

const regions: { libraries: Library[]; description: string }[] = [
  {
    libraries: [{ name: 'Kysely', href: '/docs/getting-started' }],
    description: 'SQL-first query builders',
  },
  {
    libraries: [
      { name: 'Knex', href: '/docs/comparisons/kysely-vs-knex' },
      { name: 'Zapatos', href: 'https://jawj.github.io/zapatos/' },
    ],
    description: 'Application-oriented query builders',
  },
  {
    libraries: [
      { name: 'Drizzle', href: 'https://orm.drizzle.team/docs/overview' },
      {
        name: 'Prisma 7 + Kysely',
        href: '/docs/comparisons/kysely-vs-prisma-7#try-kysely-alongside-an-existing-application',
      },
      {
        name: 'MikroORM 7',
        href: 'https://mikro-orm.io/docs/kysely',
        builder: 'Kysely',
      },
      {
        name: 'Prisma 8',
        href: 'https://docs.prisma.io/docs/orm/v8/reference/sql-query-builder',
      },
      {
        name: 'ZenStack 3',
        href: 'https://zenstack.dev/docs/orm/query-builder',
        builder: 'Kysely',
      },
    ],
    description: 'Data frameworks with SQL-first query builders',
  },
  {
    libraries: [
      {
        name: 'TypeORM',
        href: 'https://typeorm.io/docs/query-builder/select-query-builder/',
      },
      {
        name: 'Objection.js',
        href: 'https://vincit.github.io/objection.js/api/model/static-methods.html#static-knexquery',
        builder: 'Knex',
      },
      {
        name: 'Lucid',
        href: 'https://lucid.adonisjs.com/',
        builder: 'Knex',
      },
      {
        name: 'Bookshelf.js',
        href: 'https://bookshelfjs.org/',
        builder: 'Knex',
      },
    ],
    description: 'Data frameworks with application-oriented query builders',
  },
  {
    libraries: [
      { name: 'Prisma 7', href: '/docs/comparisons/kysely-vs-prisma-7' },
      {
        name: 'Sequelize',
        href: 'https://sequelize.org/docs/v6/core-concepts/model-instances/',
      },
      { name: 'Orange ORM', href: 'https://orange-orm.io/' },
    ],
    description: 'Data frameworks',
  },
]

export function SqlAbstractionSpectrum() {
  const builderLogos = {
    Kysely: useBaseUrl('/img/logo.svg'),
    Knex: useBaseUrl('/img/knex-logo.svg'),
  }

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
              {libraries.map(({ name, href, builder }) => (
                <Link key={name} to={href} className={styles.library}>
                  {name}
                  {builder && (
                    <img
                      className={styles.builderLogo}
                      src={builderLogos[builder]}
                      width={14}
                      height={14}
                      alt={`ships ${builder}`}
                      title={`ships ${builder}`}
                    />
                  )}
                </Link>
              ))}
            </div>
            <span className={styles.description}>{description}</span>
          </li>
        ))}
      </ol>
      <figcaption className={styles.caption}>
        Approximate ecosystem overview.
        <span className={styles.legendItem}>
          <img
            className={styles.builderLogo}
            src={builderLogos.Kysely}
            width={14}
            height={14}
            alt=""
          />
          <span>- ships /w Kysely.</span>
        </span>
        <span className={styles.legendItem}>
          <img
            className={styles.builderLogo}
            src={builderLogos.Knex}
            width={14}
            height={14}
            alt=""
          />
          <span>- ships /w Knex.</span>
        </span>
      </figcaption>
    </figure>
  )
}
