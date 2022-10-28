import { DeleteResult } from '../query-builder/delete-result.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { UpdateResult } from '../query-builder/update-result.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from './compilable.js'

/**
 * A helper type that allows inferring a select/insert/update/delete query's output
 * type from a query builder or compiled query.
 *
 * ### Examples
 *
 * Infer a query builder's output type:
 *
 * ```ts
 * import { Infer } from 'kysely'
 *
 * const query = db
 *   .selectFrom('person')
 *   .innerJoin('pet', 'pet.owner_id', 'person.id')
 *   .select(['person.first_name', 'pet.name'])
 *
 * type QueryResult = Infer<typeof query> // { first_name: string; name: string; }[]
 * ```
 *
 * Infer a compiled query's output type:
 *
 * ```ts
 * import { Infer } from 'kysely'
 *
 * const compiledQuery = db
 *   .insertInto('person')
 *   .values({
 *     first_name: 'Foo',
 *     last_name: 'Barson',
 *     gender: 'other',
 *     age: 15,
 *   })
 *   .returningAll()
 *   .compile()
 *
 * type QueryResult = Infer<typeof compiledQuery> // Selectable<Person>[]
 * ```
 */
export type Infer<C extends Compilable<any> | CompiledQuery<any>> =
  C extends Compilable<infer O>
    ? ResolveOutput<O>
    : C extends CompiledQuery<infer O>
    ? ResolveOutput<O>
    : never

type ResolveOutput<O> = O extends InsertResult | UpdateResult | DeleteResult
  ? O
  : O[]
