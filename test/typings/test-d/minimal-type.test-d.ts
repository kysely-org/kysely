import type { Database } from '../shared'
import type {
  MinimalSelectQueryBuilder,
  Kysely,
  AnyColumn,
  SelectQueryBuilder,
} from '..'
import { expectType } from 'tsd'

async function testMinimalType(db: Kysely<Database>) {
  const stm = db.selectFrom('book')
  const stm2 = addSelect(stm, ['id', 'name'])
  expectType<
    SelectQueryBuilder<Database, 'book', { id: number; name: string }>
  >(stm2)
  // @ts-expect-error
  addSelect(stm, ['name2'])
}

export function addSelect<DB, T extends keyof DB, O>(
  inQB: MinimalSelectQueryBuilder<DB, T, O>,
  fields: AnyColumn<DB, T>[],
) {
  const qb = inQB as SelectQueryBuilder<DB, T, O>
  return qb.select(fields)
}
