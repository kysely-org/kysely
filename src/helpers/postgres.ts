import { types } from 'pg'
import { Expression } from '../expression/expression.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { sql } from '../raw-builder/sql.js'
import {
  ShallowDehydrateValue,
  ShallowDehydrateObject,
  Simplify,
} from '../util/type-utils.js'

/**
 * A postgres helper for aggregating a subquery (or other expression) into a JSONB array.
 *
 * ### Examples
 *
 * <!-- siteExample("select", "Nested array", 110) -->
 *
 * While kysely is not an ORM and it doesn't have the concept of relations, we do provide
 * helpers for fetching nested objects and arrays in a single query. In this example we
 * use the `jsonArrayFrom` helper to fetch person's pets along with the person's id.
 *
 * Please keep in mind that the helpers under the `kysely/helpers` folder, including
 * `jsonArrayFrom`, are not guaranteed to work with third party dialects. In order for
 * them to work, the dialect must automatically parse the `json` data type into
 * JavaScript JSON values like objects and arrays. Some dialects might simply return
 * the data as a JSON string. In these cases you can use the built in `ParseJSONResultsPlugin`
 * to parse the results.
 *
 * ```ts
 * import { jsonArrayFrom } from 'kysely/helpers/postgres'
 *
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
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", (
 *   select coalesce(json_agg(agg), '[]') from (
 *     select "pet"."id" as "pet_id", "pet"."name"
 *     from "pet"
 *     where "pet"."owner_id" = "person"."id"
 *     order by "pet"."name"
 *   ) as agg
 * ) as "pets"
 * from "person"
 * ```
 */
export function jsonArrayFrom<O>(
  expr: Expression<O>,
): RawBuilder<Simplify<ShallowDehydrateObject<O>>[]> {
  return sql`(select coalesce(json_agg(agg), '[]') from ${expr} as agg)`
}

/**
 * A postgres helper for turning a subquery (or other expression) into a JSON object.
 *
 * The subquery must only return one row.
 *
 * ### Examples
 *
 * <!-- siteExample("select", "Nested object", 120) -->
 *
 * While kysely is not an ORM and it doesn't have the concept of relations, we do provide
 * helpers for fetching nested objects and arrays in a single query. In this example we
 * use the `jsonObjectFrom` helper to fetch person's favorite pet along with the person's id.
 *
 * Please keep in mind that the helpers under the `kysely/helpers` folder, including
 * `jsonObjectFrom`, are not guaranteed to work with third-party dialects. In order for
 * them to work, the dialect must automatically parse the `json` data type into
 * JavaScript JSON values like objects and arrays. Some dialects might simply return
 * the data as a JSON string. In these cases you can use the built in `ParseJSONResultsPlugin`
 * to parse the results.
 *
 * ```ts
 * import { jsonObjectFrom } from 'kysely/helpers/postgres'
 *
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
 * ```
 *
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", (
 *   select to_json(obj) from (
 *     select "pet"."id" as "pet_id", "pet"."name"
 *     from "pet"
 *     where "pet"."owner_id" = "person"."id"
 *     and "pet"."is_favorite" = $1
 *   ) as obj
 * ) as "favorite_pet"
 * from "person"
 * ```
 */
export function jsonObjectFrom<O>(
  expr: Expression<O>,
): RawBuilder<Simplify<ShallowDehydrateObject<O>> | null> {
  return sql`(select to_json(obj) from ${expr} as obj)`
}

/**
 * The PostgreSQL `json_build_object` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `PostgresDialect`.
 * While the produced SQL is compatible with all PostgreSQL databases, some third-party dialects
 * may not parse the nested JSON into objects. In these cases you can use the built in
 * `ParseJSONResultsPlugin` to parse the results.
 *
 * ### Examples
 *
 * ```ts
 * import { sql } from 'kysely'
 * import { jsonBuildObject } from 'kysely/helpers/postgres'
 *
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonBuildObject({
 *       first: eb.ref('first_name'),
 *       last: eb.ref('last_name'),
 *       full: sql<string>`first_name || ' ' || last_name`
 *     }).as('name')
 *   ])
 *   .execute()
 *
 * result[0]?.id
 * result[0]?.name.first
 * result[0]?.name.last
 * result[0]?.name.full
 * ```
 *
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * select "id", json_build_object(
 *   'first', first_name,
 *   'last', last_name,
 *   'full', first_name || ' ' || last_name
 * ) as "name"
 * from "person"
 * ```
 */
export function jsonBuildObject<O extends Record<string, Expression<unknown>>>(
  obj: O,
): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Expression<infer V>
      ? ShallowDehydrateValue<V>
      : never
  }>
> {
  return sql`json_build_object(${sql.join(
    Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]]),
  )})`
}

export type MergeAction = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * The PostgreSQL `merge_action` function.
 *
 * This function can be used in a `returning` clause to get the action that was
 * performed in a `mergeInto` query. The function returns one of the following
 * strings: `'INSERT'`, `'UPDATE'`, or `'DELETE'`.
 *
 * ### Examples
 *
 * ```ts
 * import { mergeAction } from 'kysely/helpers/postgres'
 *
 * const result = await db
 *   .mergeInto('person as p')
 *   .using('person_backup as pb', 'p.id', 'pb.id')
 *   .whenMatched()
 *   .thenUpdateSet(({ ref }) => ({
 *     first_name: ref('pb.first_name'),
 *     updated_at: ref('pb.updated_at').$castTo<string | null>(),
 *   }))
 *   .whenNotMatched()
 *   .thenInsertValues(({ ref}) => ({
 *     id: ref('pb.id'),
 *     first_name: ref('pb.first_name'),
 *     created_at: ref('pb.updated_at'),
 *     updated_at: ref('pb.updated_at').$castTo<string | null>(),
 *   }))
 *   .returning([mergeAction().as('action'), 'p.id', 'p.updated_at'])
 *   .execute()
 *
 * result[0].action
 * ```
 *
 * The generated SQL (PostgreSQL):
 *
 * ```sql
 * merge into "person" as "p"
 * using "person_backup" as "pb" on "p"."id" = "pb"."id"
 * when matched then update set
 *   "first_name" = "pb"."first_name",
 *   "updated_at" = "pb"."updated_at"::text
 * when not matched then insert values ("id", "first_name", "created_at", "updated_at")
 * values ("pb"."id", "pb"."first_name", "pb"."updated_at", "pb"."updated_at")
 * returning merge_action() as "action", "p"."id", "p"."updated_at"
 * ```
 */
export function mergeAction(): RawBuilder<MergeAction> {
  return sql`merge_action()`
}

/**
 * We can't use `new Date(v).toISOString()` because `Date` has less precision (milliseconds)
 * compared to Postgres' (microseconds). @todo: check, it seems that it truncates fractionals to 3 digits (from 6)
 *
 * @private
 */
function postgresTimestamptzToIsoString(value: string): string {
  /*
    Anatomy:
      (\d{4}-\d{2}-\d{2}) = Date
      \s+ = Space between date and time
      (\d{2}:\d{2}:\d{2}\.\d+) = Time (HH:mm:ss.ZZZZZZ)
      ([+-]\d{2})(:\d{2})? = Timezone offset (+HH[:MM] or -HH[:MM])
    Example: 2025-08-10 14:44:40.687342+02
   */
  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d+)?([+-]\d{2})(:\d{2})?$/,
  )

  if (!match) {
    throw new Error(`Invalid timestamptz format: ${value}`)
  }

  const [, date, time, offsetHour, offsetMinute = ':00'] = match
  return `${date}T${time}${offsetHour}${offsetMinute}`
}

/**
 * We can't use `new Date(v).toISOString()` because `Date` has less precision (milliseconds)
 * compared to Postgres' (microseconds).
 *
 * @private
 */
function postgresTimestampToIsoString(value: string): string {
  /*
    Anatomy:
      (\d{4}-\d{2}-\d{2}) = Date
      \s+ = Space between date and time
      (\d{2}:\d{2}:\d{2}\.\d+) = Time (HH:mm:ss.ZZZZZZ)
    Example: 2025-08-10 14:44:40.687342
   */
  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d+)?$/)

  if (!match) {
    throw new Error(`Invalid timestamptz format: ${value}`)
  }

  const [, date, time] = match
  return `${date}T${time}`
}

/**
 * @todo: document
 */
export const SENSIBLE_TYPES: Record<number, (value: string) => any> = {
  [types.builtins.TIMESTAMPTZ]: (v) => postgresTimestamptzToIsoString(v),
  [types.builtins.TIMESTAMP]: (v) => postgresTimestampToIsoString(v),
  [types.builtins.DATE]: (v) => v,
}
