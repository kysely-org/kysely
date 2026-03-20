import { Kysely, RawBuilder, sql } from 'kysely'
import { KyselyTypeError } from '../../src/util/type-error'

function expectOutdatedTSError(
  _: KyselyTypeError<'The installed TypeScript version is outdated and cannot guarantee type-safety with Kysely. Please upgrade to version 4.7 or newer.'>,
): void {}

expectOutdatedTSError(Kysely)
expectOutdatedTSError(RawBuilder)
expectOutdatedTSError(sql)
