import { Expression } from '../expression/expression.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { sql } from '../raw-builder/sql.js'
import { Simplify } from '../util/type-utils.js'

/**
 * A postgres helper for aggregating a subquery (or other expression) into a JSONB array.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `PostgresDialect`.
 * While the produced SQL is compatibe with all PostgreSQL databases, some 3rd party dialects
 * may not parse the nested results into arrays.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select([
 *     'id',
 *     eb => rowsToJsonb(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .where('pet.owner_id', '=', 'person.id')
 *         .orderBy('pet.name')
 *     ).as('pets')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].pets[0].pet_id
 * result[0].pets[0].name
 * ```
 *
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", (
 *   select coalesce(jsonb_agg(agg), '[]') from (
 *     select "pet"."id" as "pet_id", "pet"."name"
 *     from "pet"
 *     where "pet"."owner_id" = "person"."id"
 *     order by "pet"."name"
 *   ) as agg
 * ) as "pets"
 * from "person"
 * ```
 */
export function rowsToJsonb<O>(expr: Expression<O>): RawBuilder<Simplify<O>[]> {
  return sql`(select coalesce(jsonb_agg(agg), '[]') from ${expr} as agg)`
}

/**
 * A postgres helper for turning a subquery (or other expression) into a JSONB object.
 *
 * The subquery must only return one row.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `PostgresDialect`.
 * While the produced SQL is compatibe with all PostgreSQL databases, some 3rd party dialects
 * may not parse the nested results into objects.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select([
 *     'id',
 *     eb => rowToJsonb(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .where('pet.owner_id', '=', 'person.id')
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
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", (
 *   select to_jsonb(obj) from (
 *     select "pet"."id" as "pet_id", "pet"."name"
 *     from "pet"
 *     where "pet"."owner_id" = "person"."id"
 *     and "pet"."is_favorite" = $1
 *   ) as obj
 * ) as "favorite_pet"
 * from "person"
 * ```
 */
export function rowToJsonb<O>(expr: Expression<O>): RawBuilder<Simplify<O>> {
  return sql`(select to_jsonb(obj) from ${expr} as obj)`
}

/**
 * The PostgreSQL `jsonb_build_object` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `PostgresDialect`.
 * While the produced SQL is compatibe with all PostgreSQL databases, some 3rd party dialects
 * may not parse the nested results into objects.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select([
 *     'id',
 *     eb => jsonbBuildObject({
 *       first: eb.ref('first_name'),
 *       last: eb.ref('last_name'),
 *       full: sql<string>`first_name || ' ' || last_name`
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
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", jsonb_build_object(
 *   'first', first_name,
 *   'last', last_name,
 *   'full', first_name || ' ' || last_name
 * ) as "name"
 * from "person"
 * ```
 */
export function jsonbBuildObject<O extends Record<string, Expression<unknown>>>(
  obj: O
): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Expression<infer V> ? V : never
  }>
> {
  return sql`jsonb_build_object(${sql.join(
    Object.keys(obj).flatMap((k) => [sql.literal(k), obj[k]])
  )})`
}
