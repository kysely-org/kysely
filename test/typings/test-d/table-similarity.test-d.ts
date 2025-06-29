import { expectError } from 'tsd'
import {
  Expression,
  expressionBuilder,
  Kysely,
  Selectable,
  SelectQueryBuilder,
  SelectType,
  TableSimilarity,
} from '..'
import { Database } from '../shared'

async function test(db: Kysely<Database>) {
  type NameSimilarity = TableSimilarity<Database, 'name'>

  function selectByName<TB extends NameSimilarity['TB']>(
    table: TB,
    name: SelectType<NameSimilarity['DB'][TB]['name']>,
  ): Expression<Selectable<Database[TB]>> {
    const eb = expressionBuilder<NameSimilarity['DB'], never>()

    return eb
      .selectFrom(db.dynamic.table<NameSimilarity['TB']>(table).as('t'))
      .where('t.name', '=', name)
      .selectAll() as never
  }

  selectByName('book', "The Hitchhiker's Guide to the Galaxy")
  selectByName('pet', 'Fido')

  // doesn't have a name column
  expectError(selectByName('person', 'John Doe'))
  // name is a string, not a number
  expectError(selectByName('book', 2))
}
