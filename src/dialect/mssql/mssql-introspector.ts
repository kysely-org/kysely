import { Kysely } from '../../kysely.js'
import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
} from '../database-introspector.js'

export class MssqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    throw new Error('Not implemented')
  }

  async getTables(
    options?: DatabaseMetadataOptions | undefined
  ): Promise<TableMetadata[]> {
    throw new Error('Not implemented')
  }

  async getMetadata(
    options?: DatabaseMetadataOptions | undefined
  ): Promise<DatabaseMetadata> {
    throw new Error('Not implemented')
  }
}
