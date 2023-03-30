import { Expression } from '../expression/expression.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { sql } from '../raw-builder/sql.js'
import { Simplify } from '../util/type-utils.js'

/**
 * A MySQL helper for aggregating a subquery (or other expression) into a JSON array.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MysqlDialect`.
 * While the produced SQL is compatibe with all MySQL databases, some 3rd party dialects
 * may not parse the nested results into arrays.
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
 * The generated SQL (MySQL):
 *
 * ```sql
 * select `id`, (
 *   select cast(coalesce(json_arrayagg(json_object(
 *     'pet_id', `agg`.`pet_id`,
 *     'name', `agg`.`name`
 *   )), '[]') as json) from (
 *     select `pet`.`id` as `pet_id`, `pet`.`name`
 *     from `pet`
 *     where `pet`.`owner_id` = `person`.`id`
 *     order by `pet`.`name`
 *   ) as `agg`
 * ) as `pets`
 * from `person`
 * ```
 */
export function jsonArrayFrom<O>(
  expr: SelectQueryBuilder<any, any, O>
): RawBuilder<Simplify<O>[]> {
  return sql`(select cast(coalesce(json_arrayagg(json_object(${sql.join(
    getJsonObjectArgs(expr.toOperationNode(), 'agg')
  )})), '[]') as json) from ${expr} as agg)`
}

/**
 * A MySQL helper for turning a subquery (or other expression) into a JSON object.
 *
 * The subquery must only return one row.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MysqlDialect`.
 * While the produced SQL is compatibe with all MySQL databases, some 3rd party dialects
 * may not parse the nested results into objects.
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
 * The generated SQL (MySQL):
 *
 * ```sql
 * select `id`, (
 *   select json_object(
 *     'pet_id', `obj`.`pet_id`,
 *     'name', `obj`.`name`
 *   ) from (
 *     select `pet`.`id` as `pet_id`, `pet`.`name`
 *     from `pet`
 *     where `pet`.`owner_id` = `person`.`id`
 *     and `pet`.`is_favorite` = ?
 *   ) as obj
 * ) as `favorite_pet`
 * from `person`
 * ```
 */
export function jsonObjectFrom<O>(
  expr: SelectQueryBuilder<any, any, O>
): RawBuilder<Simplify<O>> {
  return sql`(select json_object(${sql.join(
    getJsonObjectArgs(expr.toOperationNode(), 'obj')
  )}) from ${expr} as obj)`
}

/**
 * The MySQL `json_object` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MysqlDialect`.
 * While the produced SQL is compatibe with all MySQL databases, some 3rd party dialects
 * may not parse the nested results into objects.
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
 * select "id", json_object(
 *   'first', first_name,
 *   'last', last_name,
 *   'full', concat(`first_name`, ?, `last_name`)
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
  return sql`json_object(${sql.join(
    Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]])
  )})`
}

function getJsonObjectArgs(
  node: SelectQueryNode,
  table: string
): RawBuilder<unknown>[] {
  return node.selections!.flatMap(({ selection: s }) => {
    if (ReferenceNode.is(s) && ColumnNode.is(s.column)) {
      return [
        sql.lit(s.column.column.name),
        sql.id(table, s.column.column.name),
      ]
    } else if (ColumnNode.is(s)) {
      return [sql.lit(s.column.name), sql.id(table, s.column.name)]
    } else if (AliasNode.is(s) && IdentifierNode.is(s.alias)) {
      return [sql.lit(s.alias.name), sql.id(table, s.alias.name)]
    } else {
      throw new Error(
        'MySQL jsonArrayFrom and jsonObjectFrom functions can only handle explicit selections due to limitations of the json_object function. selectAll() is not allowed in the subquery.'
      )
    }
  })
}
