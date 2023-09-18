import { Expression } from '../expression/expression.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { sql } from '../raw-builder/sql.js'
import { Simplify } from '../util/type-utils.js'

/**
 * A MSSQL helper for aggregating a subquery into a JSON array.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MssqlDialect`.
 * The MssqlDialect will not parse the nested JSON into arrays. You must use the built in
 * `ParseJSONResultsPlugin` to parse the results.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonArrayFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .whereRef('pet.owner_id', '=', 'person.id')
 *         .orderBy('pet.name')
 *     ).as('pets')
 *   ])
 *   .execute()
 * ```
 *
 * The generated SQL (MSSQL):
 *
 * ```sql
 * select "id", coalesce(
 *   (
 *     select "pet"."id" as "pet_id", "pet"."name"
 *     from "pet"
 *     where "pet"."owner_id" = "person"."id"
 *     order by "pet"."name" for json path
 *   ), '[]'
 * ) as "pets"
 * from "person"
 * ```
 */
export function jsonArrayFrom<O>(
  expr: SelectQueryBuilder<any, any, O>
): RawBuilder<Simplify<O>[]> {
  return sql`coalesce(${expr.modifyEnd(sql`for json path`)}, '[]')`
}

/**
 * A MSSQL helper for turning a subquery into a JSON object.
 *
 * The subquery must only return one row.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MssqlDialect`.
 * The MssqlDialect will not parse the nested JSON into objects. You must use the built in
 * `ParseJSONResultsPlugin` to parse the results.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonObjectFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .whereRef('pet.owner_id', '=', 'person.id')
 *         .where('pet.is_favorite', '=', true)
 *     ).as('favorite_pet')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].favorite_pet.pet_id
 * result[0].favorite_pet.name
 * ```
 *
 * The generated SQL (MSSQL):
 *
 * ```sql
 * select `id`, (
 *   select select "pet"."id" as "pet_id", "pet"."name"
 *   from "pet"
 *   where "pet"."owner_id" = "person"."id"
 *   and "pet"."name" = @1
 *   FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
 * ) as `favorite_pet`
 * from `person`
 * ```
 */
export function jsonObjectFrom<O>(
  expr: SelectQueryBuilder<any, any, O>
): RawBuilder<Simplify<O> | null> {
  return sql`${expr.modifyEnd(sql`FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`)}`
}

/**
 * The MSSQL `JSON_OBJECT` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MssqlDialect`.
 * The MssqlDialect will not parse the nested JSON into objects. You must use the built in
 * `ParseJSONResultsPlugin` to parse the results.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonBuildObject({
 *       first: eb.ref('first_name'),
 *       last: eb.ref('last_name'),
 *       full: eb.fn('concat', ['first_name', eb.val(' '), 'last_name'])
 *     }).as('name')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].name.first
 * result[0].name.last
 * result[0].name.full
 * ```
 *
 * The generated SQL (MySQL):
 *
 * ```sql
 * select "id", JSON_OBJECT(
 *   'first', first_name,
 *   'last', last_name,
 *   'full', concat(`first_name`, @1, `last_name`)
 * ) as "name"
 * from "person"
 * ```
 */
export function jsonBuildObject<O extends Record<string, Expression<unknown>>>(
  obj: O
): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Expression<infer V> ? V : never
  }>
> {
  return sql`JSON_OBJECT(${sql.join(
    Object.keys(obj).map((k) => sql.join([sql.lit(k), obj[k]], sql`:`))
  )})`
}
