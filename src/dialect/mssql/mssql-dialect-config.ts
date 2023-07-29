import { Pool } from 'tarn'
import { Connection, ISOLATION_LEVEL, Request, TYPES } from 'tedious'

export interface MssqlDialectConfig {
  connectionFactory: () => Connection | Promise<Connection>
  Tarn: Tarn
  Tedious: Tedious
}

export interface Tarn {
  Pool: typeof Pool
  options: Omit<
    ConstructorParameters<typeof Pool>[0],
    'create' | 'destroy' | 'validate'
  >
}

export interface Tedious {
  Request: typeof Request
  ISOLATION_LEVEL: typeof ISOLATION_LEVEL
  TYPES: typeof TYPES
}
