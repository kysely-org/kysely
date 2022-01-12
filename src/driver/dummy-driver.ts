import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { DatabaseConnection, QueryResult } from './database-connection.js'
import { Driver } from './driver.js'

export class DummyDriver implements Driver {
  init(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new DummyConnection()
  }

  async beginTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async commitTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async rollbackTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async releaseConnection(): Promise<void> {
    // Nothing to do here.
  }

  async destroy(): Promise<void> {
    // Nothing to do here.
  }
}

class DummyConnection implements DatabaseConnection {
  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    return {
      rows: [],
    }
  }
}
