import { expressionBuilder, type Kysely, sql } from './src'
import type { DB } from './test/typings/test-d/huge-db.test-d'

async function foo(db: Kysely<DB>) {
  const eb = expressionBuilder<DB, 'my_table'>()

  // HAPPY PLAY TIME!
}
