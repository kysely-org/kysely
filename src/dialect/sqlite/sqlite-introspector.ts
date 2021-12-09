import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
} from '../../introspection/database-introspector.js'
import { Kysely } from '../../kysely.js'
import {
  MIGRATION_LOCK_TABLE,
  MIGRATION_TABLE,
} from '../../migration/migration.js'

export class SqliteIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getMetadata(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<DatabaseMetadata> {
    let query = this.#db
      .selectFrom('sqlite_schema')
      .where('type', '=', 'table')
      .where('name', 'not like', 'sqlite_%')
      .select('name')

    if (!options.withInternalKyselyTables) {
      query = query
        .where('name', '!=', MIGRATION_TABLE)
        .where('name', '!=', MIGRATION_LOCK_TABLE)
    }

    const result = await query.execute()

    return {
      tables: result.map((it) => ({
        name: it.name,
        // TODO: Get columns somehow.
        columns: [],
      })),
    }
  }
}
