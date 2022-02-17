import { ReturningRow } from '../parser/returning-parser.js'
import { SelectExpression } from '../parser/select-parser.js'
import { Selectable } from '../util/column-type.js'

export interface ReturningInterface<DB, TB extends keyof DB, O> {
  /**
   * Allows you to return data from modified rows.
   *
   * On supported databases like PostgreSQL, this method can be chained to
   * `insert`, `update` and `delete` queries to return data.
   *
   * Note that on SQLite you need to give aliases for the expressions to avoid
   * [this bug](https://sqlite.org/forum/forumpost/033daf0b32) in SQLite.
   * For example `.returning('id as id')`.
   *
   * Also see the {@link returningAll} method.
   *
   * ### Examples
   *
   * Return one column:
   *
   * ```ts
   * const { id } = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning('id')
   *   .executeTakeFirst()
   * ```
   *
   * Return multiple columns:
   *
   * ```ts
   * const { id, first_name } = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning(['id', 'last_name'])
   *   .executeTakeFirst()
   * ```
   *
   * Return arbitrary expressions:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const { id, full_name, first_pet_id } = await db
   *   .insertInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .returning([
   *     'id as id',
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name'),
   *     (qb) => qb.selectFrom('pets').select('pet.id').limit(1).as('first_pet_id')
   *   ])
   *   .executeTakeFirst()
   * ```
   */
  returning<SE extends SelectExpression<DB, TB>>(
    selections: ReadonlyArray<SE>
  ): ReturningInterface<DB, TB, ReturningRow<DB, TB, O, SE>>

  returning<SE extends SelectExpression<DB, TB>>(
    selection: SE
  ): ReturningInterface<DB, TB, ReturningRow<DB, TB, O, SE>>

  /**
   * Adds a `returning *` to an insert/update/delete query on databases
   * that support `returning` such as PostgreSQL.
   */
  returningAll(): ReturningInterface<DB, TB, Selectable<DB[TB]>>
}
