import { expectError, expectType } from 'tsd'
import type { Database } from '../shared.js'
import type {
  Command,
  ControlledTransaction,
  Transaction,
} from '../index.js'

async function testSavepoint(
  tx: ControlledTransaction<Database, ['sp1', 'sp2']>,
) {
  // creating a savepoint appends its name to the list of open savepoints.
  expectType<Command<ControlledTransaction<Database, ['sp1', 'sp2', 'sp3']>>>(
    tx.savepoint('sp3'),
  )
}

async function testRollbackToSavepoint(
  tx: ControlledTransaction<Database, ['sp1', 'sp2']>,
) {
  // rolling back to a savepoint keeps it open and discards the ones created
  // after it.
  expectType<Command<ControlledTransaction<Database, ['sp1', 'sp2']>>>(
    tx.rollbackToSavepoint('sp2'),
  )
  expectType<Command<ControlledTransaction<Database, ['sp1']>>>(
    tx.rollbackToSavepoint('sp1'),
  )

  // only open savepoints can be rolled back to.
  expectError(tx.rollbackToSavepoint('nope'))
}

async function testReleaseSavepoint(
  tx: ControlledTransaction<Database, ['sp1', 'sp2']>,
) {
  // releasing a savepoint removes it and the ones created after it.
  expectType<Command<ControlledTransaction<Database, ['sp1']>>>(
    tx.releaseSavepoint('sp2'),
  )
  expectType<Command<ControlledTransaction<Database, []>>>(
    tx.releaseSavepoint('sp1'),
  )

  // only open savepoints can be released.
  expectError(tx.releaseSavepoint('nope'))

  // when the savepoint list is `any`, the released list degrades to
  // `string[]` instead of leaking bogus inference candidates. see #1967.
  const anyTx = tx as ControlledTransaction<Database, any>
  expectType<Command<ControlledTransaction<Database, string[]>>>(
    anyTx.releaseSavepoint('whatever'),
  )
}

// #1967: matching `ControlledTransaction<infer DB, any>` used to silently
// infer `DB` as `string` because of `releaseSavepoint`'s return type.
async function testControlledTransactionTypeArgumentInference(
  tx: ControlledTransaction<Database, ['sp1']>,
  trx: Transaction<Database>,
) {
  type DatabaseOf<T> =
    T extends ControlledTransaction<infer DB, any> ? DB : never
  type SavepointsOf<T> =
    T extends ControlledTransaction<any, infer S> ? S : never
  type BothOf<T> =
    T extends ControlledTransaction<infer DB, infer S> ? [DB, S] : never
  type TransactionDatabaseOf<T> =
    T extends Transaction<infer DB> ? DB : never

  expectType<Database>(null as unknown as DatabaseOf<typeof tx>)
  expectType<['sp1']>(null as unknown as SavepointsOf<typeof tx>)
  expectType<[Database, ['sp1']]>(null as unknown as BothOf<typeof tx>)
  expectType<Database>(null as unknown as TransactionDatabaseOf<typeof trx>)
}
