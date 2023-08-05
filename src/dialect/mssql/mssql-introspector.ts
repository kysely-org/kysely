import { Kysely } from '../../kysely.js'
import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
} from '../database-introspector.js'

export class MssqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<MssqlSysTables>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    return await this.#db.selectFrom('sys.schemas').select('name').execute()
  }

  async getTables(
    options?: DatabaseMetadataOptions | undefined
  ): Promise<TableMetadata[]> {
    throw new Error('Not implemented')
  }

  async getMetadata(
    options?: DatabaseMetadataOptions | undefined
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }
}

interface MssqlSysTables {
  'sys.schemas': {
    name: string
  }
}
