import { BoundJSONPathBuilder, JSONPathBuilder, Kysely, sql } from '../../..'
import { DB_CONFIGS, DIALECTS, testSql } from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: json path`, () => {
    const db = new Kysely(DB_CONFIGS[dialect])
    const builder = new JSONPathBuilder<
      {
        person_metadata: {
          person_id: number
          website: {
            url: string
            image: {
              favicon: string
            }
          }
          nicknames: string[]
          roles: {
            title: string
          }[]
          scoreSets: number[][]
        }
      },
      'person_metadata'
    >()

    it('should output $', () => {
      const query = getCompilable(builder.$('website'))

      testSql(query, dialect, {
        postgres: {
          sql: `'$'`,
          parameters: [],
        },
        mysql: {
          sql: `'$'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$'`,
          parameters: [],
        },
      })
    })

    it('should output $.key', () => {
      const query = getCompilable(builder.$('website').key('url'))

      testSql(query, dialect, {
        postgres: {
          sql: `'$.url'`,
          parameters: [],
        },
        mysql: {
          sql: `'$.url'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$.url'`,
          parameters: [],
        },
      })
    })

    it('should output $[number]', () => {
      const query = getCompilable(builder.$('nicknames').at(0))

      testSql(query, dialect, {
        postgres: {
          sql: `'$[0]'`,
          parameters: [],
        },
        mysql: {
          sql: `'$[0]'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$[0]'`,
          parameters: [],
        },
      })
    })

    it('should output $.key.key', () => {
      const query = getCompilable(
        builder.$('website').key('image').key('favicon')
      )

      testSql(query, dialect, {
        postgres: {
          sql: `'$.image.favicon'`,
          parameters: [],
        },
        mysql: {
          sql: `'$.image.favicon'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$.image.favicon'`,
          parameters: [],
        },
      })
    })

    it('should output $[number].key', () => {
      const query = getCompilable(builder.$('roles').at(-1).key('title'))

      testSql(query, dialect, {
        postgres: {
          sql: `'$[-1].title'`,
          parameters: [],
        },
        mysql: {
          sql: `'$[-1].title'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$[-1].title'`,
          parameters: [],
        },
      })
    })

    it('should output $[number][number]', () => {
      const query = getCompilable(builder.$('scoreSets').at(-1).at(0))

      testSql(query, dialect, {
        postgres: {
          sql: `'$[-1][0]'`,
          parameters: [],
        },
        mysql: {
          sql: `'$[-1][0]'`,
          parameters: [],
        },
        sqlite: {
          sql: `'$[-1][0]'`,
          parameters: [],
        },
      })
    })

    function getCompilable(builder: BoundJSONPathBuilder<any, any>) {
      return {
        compile: () => sql`${builder}`.compile(db),
      }
    }
  })
}
