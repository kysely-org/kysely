export type Dialect = 'postgresql' | 'mysql' | 'sqlite'

export type PropsWithDialect<P = {}> = P & {
  dialect: Dialect
  dialectsURL: string
}
