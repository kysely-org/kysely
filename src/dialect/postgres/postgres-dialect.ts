import { Driver } from '../../driver/driver'
import { DriverConfig } from '../../driver/driver-config'
import { Kysely } from '../../kysely'
import { parseTable } from '../../parser/table-parser'
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
    const tableNode = parseTable(tableName)

    let query = db
      .selectFrom('information_schema.tables')
      .where('table_name', '=', tableNode.table.identifier)
      .select('table_name')

    if (tableNode.schema) {
      query = query.where('table_schema', '=', tableNode.schema.identifier)
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
