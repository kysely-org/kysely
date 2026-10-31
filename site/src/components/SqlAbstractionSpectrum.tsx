import styles from './SqlAbstractionSpectrum.module.css'

export function SqlAbstractionSpectrum() {
  return (
    <figure
      className={styles.figure}
      aria-label="SQL query builders and ORM model APIs"
    >
      <div className={styles.axis} aria-hidden="true">
        <span>Compose SQL</span>
        <span>Work with models</span>
      </div>
      <div className={styles.groups}>
        <div className={`${styles.group} ${styles.highlight}`}>
          <p className={styles.title}>SQL query builders &amp; toolkits</p>
          <ul>
            <li>
              <a href="/docs/getting-started">Kysely</a>
            </li>
            <li>
              <a href="https://knexjs.org/">Knex</a>
            </li>
            <li>
              <a href="https://jawj.github.io/zapatos/">Zapatos</a>
            </li>
          </ul>
          <p>Compose queries against tables and columns.</p>
        </div>
        <div className={styles.group}>
          <p className={styles.title}>ORMs with query builders</p>
          <ul>
            <li>
              <a href="https://orm.drizzle.team/docs/select">Drizzle</a>
              <span>SQL and relational query APIs</span>
            </li>
            <li>
              <a href="https://typeorm.io/docs/query-builder/select-query-builder/">
                TypeORM
              </a>
              <span>with its own query builder</span>
            </li>
            <li>
              <a href="https://lucid.adonisjs.com/docs/introduction">Lucid</a>
              <span>with Knex</span>
            </li>
            <li>
              <a href="https://vincit.github.io/objection.js/guide/query-examples.html">
                Objection.js
              </a>{' '}
              <span>with Knex</span>
            </li>
            <li>
              <a href="https://mikro-orm.io/docs/kysely">MikroORM</a>{' '}
              <span>with Kysely</span>
            </li>
          </ul>
          <p>Combine SQL composition with model and relationship operations.</p>
        </div>
        <div className={styles.group}>
          <p className={styles.title}>ORM model APIs</p>
          <ul>
            <li>
              <a href="https://sequelize.org/docs/v6/core-concepts/model-querying-basics/">
                Sequelize
              </a>
            </li>
            <li>
              <a href="https://orange-orm.io/">Orange ORM</a>
            </li>
            <li>
              <a href="https://www.prisma.io/docs/orm/prisma-client/queries">
                Prisma 7
              </a>
            </li>
          </ul>
          <p>
            Query models and persist related records through model operations.
          </p>
        </div>
      </div>
      <figcaption className={styles.caption}>
        Grouped by the interfaces they offer, not ranked by capability. Zapatos
        combines SQL templates with typed query helpers; Prisma also supports
        raw SQL and TypedSQL. An ORM can include a builder without making the
        builder itself an ORM.
      </figcaption>
    </figure>
  )
}
