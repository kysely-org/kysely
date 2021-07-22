import { table } from 'console'
import { Driver } from '../../driver/driver'
import { DriverConfig } from '../../driver/driver-config'
import { Kysely } from '../../kysely'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler'
import { QueryCompiler } from '../../query-compiler/query-compiler'
import { Dialect, TableMetadata } from '../dialect'
import { PostgresDriver } from './postgres-driver'

export class PostgresDialect implements Dialect {
  createDriver(config: DriverConfig): Driver {
    return new PostgresDriver(config)
  }

  createQueryCompiler(): QueryCompiler {
    // The default query compiler is for postgres dialect.
    return new DefaultQueryCompiler()
  }

  async getTableMetadata(
    db: Kysely<any>,
    tableName: string
  ): Promise<TableMetadata | undefined> {
    const parts = tableName.split('.')

    let query = db
      .selectFrom('information_schema.tables')
      .where('table_name', '=', parts[parts.length - 1])
      .select('table_name')

    if (parts.length === 2) {
      query = query.where('table_schema', '=', parts[0])
    }

    const result = await query.executeTakeFirst()

    if (!result) {
      return undefined
    }

    return {
      tableName: result.table_name,
    }
  }
}
