import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { parseStringReference } from '../parser/reference-parser.js'
import { parseTable } from '../parser/table-parser.js'
import { parseValueExpression } from '../parser/value-parser.js'
import { createQueryId } from '../util/query-id.js'
import { RawBuilder, createRawBuilder } from './raw-builder.js'

export interface Sql {
  /**
   * Template tag for creating raw SQL snippets and queries.
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const id = 123
   * const snippet = sql<Person[]>`select * from person where id = ${id}`
   * ```
   *
   * Substitutions (the things inside `${}`) are automatically passed to the database
   * as parameters and are never interpolated to the SQL string. There's no need to worry
   * about SQL injection vulnerabilities. Substitutions can be values, other `sql`
   * expressions, queries and almost anything else Kysely can produce and they get
   * handled correctly. See the examples below.
   *
   * If you need your substitutions to be interpreted as identifiers, value literals or
   * lists of things, see the {@link Sql.ref}, {@link Sql.table}, {@link Sql.id},
   * {@link Sql.lit}, {@link Sql.raw} and {@link Sql.join} functions.
   *
   * You can pass sql snippets returned by the `sql` tag pretty much anywhere. Whenever
   * something can't be done using the Kysely API, you should be able to drop down to
   * raw SQL using the `sql` tag. Here's an example query that uses raw sql in a bunch
   * of methods:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .select(
   *     // If you use `sql` in a select statement, remember to call the `as`
   *     // method to give it an alias.
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name')
   *   )
   *   .where(sql`birthdate between ${date1} and ${date2}`)
   *   // Here we assume we have list of nicknames for the person
   *   // (a list of strings) and we use the PostgreSQL `@>` operator
   *   // to test if all of them are valid nicknames for the user.
   *   .where('nicknames', '@>', sql`ARRAY[${sql.join(nicknames)}]`)
   *   .orderBy(sql`concat(first_name, ' ', last_name)`)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select concat(first_name, ' ', last_name) as "full_name"
   * from "person"
   * where birthdate between $1 and $2
   * and "nicknames" @> ARRAY[$3, $4, $5, $6, $7, $8, $9, $10]
   * order by concat(first_name, ' ', last_name)
   * ```
   *
   * SQL snippets can be executed by calling the `execute` method and passing a `Kysely`
   * instance as the only argument:
   *
   * ```ts
   * const result = await sql<Person[]>`select * from person`.execute(db)
   * ```
   *
   * You can merge other `sql` expressions and queries using substitutions:
   *
   * ```ts
   * const petName = db.selectFrom('pet').select('name').limit(1)
   * const fullName = sql`concat(first_name, ' ', last_name)`
   *
   * sql`
   *   select ${fullName} as full_name, ${petName} as pet_name
   *   from person
   * `
   * ```
   *
   * Substitutions also handle {@link ExpressionBuilder.ref},
   * {@link DynamicModule.ref} and pretty much anything else you
   * throw at it. Here's an example of calling a function in a
   * type-safe way:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select([
   *     'first_name',
   *     'last_name',
   *     (eb) => {
   *       // The `eb.ref` method is type-safe and only accepts
   *       // column references that are possible.
   *       const firstName = eb.ref('first_name')
   *       const lastName = eb.ref('last_name')
   *
   *       const fullName = sql<string>`concat(${firstName}, ' ', ${lastName})`
   *       return fullName.as('full_name')
   *     }
   *   ])
   * ```
   *
   * don't know if that amount of ceremony is worth the small increase in
   * type-safety though... But it's possible.
   */
  <T = unknown>(
    sqlFragments: TemplateStringsArray,
    ...parameters: unknown[]
  ): RawBuilder<T>

  /**
   * `sql.val(value)` is a shortcut for:
   *
   * ```ts
   * sql<ValueType>`${value}`
   * ```
   */
  val<V>(value: V): RawBuilder<V>

  /**
   * @deprecated Use {@link Sql.val} instead.
   */
  value<V>(value: V): RawBuilder<V>

  /**
   * This can be used to add runtime column references to SQL snippets.
   *
   * By default `${}` substitutions in {@link sql} template strings get
   * transformed into parameters. You can use this function to tell
   * Kysely to interpret them as column references instead.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   *
   * ```ts
   * const columnRef = 'first_name'
   *
   * sql`select ${sql.ref(columnRef)} from person`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name" from person
   * ```
   *
   * The refefences can also include a table name:
   *
   * ```ts
   * const columnRef = 'person.first_name'
   *
   * sql`select ${sql.ref(columnRef)}} from person`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."first_name" from person
   * ```
   *
   * The refefences can also include a schema on supported databases:
   *
   * ```ts
   * const columnRef = 'public.person.first_name'
   *
   * sql`select ${sql.ref(columnRef)}} from person`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "public"."person"."first_name" from person
   * ```
   */
  ref<R = unknown>(columnReference: string): RawBuilder<R>

  /**
   * This can be used to add runtime table references to SQL snippets.
   *
   * By default `${}` substitutions in {@link sql} template strings get
   * transformed into parameters. You can use this function to tell
   * Kysely to interpret them as table references instead.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   *
   * ```ts
   * const table = 'person'
   *
   * sql`select first_name from ${sql.table(table)}`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select first_name from "person"
   * ```
   *
   * The refefences can also include a schema on supported databases:
   *
   * ```ts
   * const table = 'public.person'
   *
   * sql`select first_name from ${sql.table(table)}`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select first_name from "public"."person"
   * ```
   */
  table(tableReference: string): RawBuilder<unknown>

  /**
   * This can be used to add arbitrary identifiers to SQL snippets.
   *
   * Does the same thing as {@link Sql.ref | ref} and {@link Sql.table | table}
   * but can also be used for any other identifiers like index names.
   *
   * You should use {@link Sql.ref | ref} and {@link Sql.table | table}
   * instead of this whenever possible as they produce a more sematic
   * operation node tree.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   *
   * ```ts
   * const indexName = 'person_first_name_index'
   *
   * sql`create index ${indexName} on person`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "person_first_name_index" on person
   * ```
   *
   * Multiple identifiers get separated by dots:
   *
   * ```ts
   * const schema = 'public'
   * const columnName = 'first_name'
   * const table = 'person'
   *
   * sql`select ${sql.id(schema, table, columnName)}} from ${sql.id(schema, table)}`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "public"."person"."first_name" from "public"."person"
   * ```
   */
  id(...ids: readonly string[]): RawBuilder<unknown>

  /**
   * This can be used to add literal values to SQL snippets.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   * You almost always want to use normal substitutions that get sent to the
   * db as parameters.
   *
   * ```ts
   * const firstName = 'first_name'
   *
   * sql`select * from person where first_name = ${sql.lit(firstName)}`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from person where first_name = 'first_name'
   * ```
   *
   * As you can see from the example above, the value was added directly to
   * the SQL string instead of as a parameter. Only use this function when
   * something can't be sent as a parameter.
   */
  lit<V>(value: V): RawBuilder<V>

  /**
   * @deprecated Use {@link lit} instead.
   */
  literal<V>(value: V): RawBuilder<V>

  /**
   * This can be used to add arbitrary runtime SQL to SQL snippets.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   *
   * ```ts
   * const firstName = "'first_name'"
   *
   * sql`select * from person where first_name = ${sql.raw(firstName)}`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from person where first_name = 'first_name'
   * ```
   *
   * Note that the difference to `sql.lit` is that this function
   * doesn't assume the inputs are values. The input to this function
   * can be any sql and it's simply glued to the parent string as-is.
   */
  raw<R = unknown>(anySql: string): RawBuilder<R>

  /**
   * This can be used to add lists of things to SQL snippets.
   *
   * ### Examples
   *
   * ```ts
   * function findByNicknames(nicknames: string[]): Promise<Person[]> {
   *   return db
   *     .selectFrom('person')
   *     .selectAll()
   *     .where('nicknames', '@>', sql`ARRAY[${sql.join(nicknames)}]`)
   *     .execute()
   * }
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * where "nicknames" @> ARRAY[$1, $2, $3, $4, $5, $6, $7, $8]
   * ```
   *
   * The second argument is the joining SQL expression that defaults
   * to
   *
   * ```ts
   * sql`, `
   * ```
   *
   * In addition to values, items in the list can be also {@link sql}
   * expressions, queries or anything else the normal substitutions
   * support:
   *
   * ```ts
   * const things = [
   *   123,
   *   sql`(1 == 1)`,
   *   db.selectFrom('person').selectAll(),
   *   sql.lit(false),
   *   sql.id('first_name')
   * ]
   *
   * sql`BEFORE ${sql.join(things, sql`::varchar, `)} AFTER`
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * BEFORE $1::varchar, (1 == 1)::varchar, (select * from "person")::varchar, false::varchar, "first_name" AFTER
   * ```
   */
  join(
    array: readonly unknown[],
    separator?: RawBuilder<any>
  ): RawBuilder<unknown>
}

export const sql: Sql = Object.assign(
  <T = unknown>(
    sqlFragments: TemplateStringsArray,
    ...parameters: unknown[]
  ): RawBuilder<T> => {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.create(
        sqlFragments,
        parameters?.map(parseValueExpression) ?? []
      ),
    })
  },
  {
    ref<R = unknown>(columnReference: string): RawBuilder<R> {
      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithChild(parseStringReference(columnReference)),
      })
    },

    val<V>(value: V): RawBuilder<V> {
      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithChild(parseValueExpression(value)),
      })
    },

    value<V>(value: V): RawBuilder<V> {
      return this.val(value)
    },

    table(tableReference: string): RawBuilder<unknown> {
      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithChild(parseTable(tableReference)),
      })
    },

    id(...ids: readonly string[]): RawBuilder<unknown> {
      const fragments = new Array<string>(ids.length + 1).fill('.')

      fragments[0] = ''
      fragments[fragments.length - 1] = ''

      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.create(fragments, ids.map(IdentifierNode.create)),
      })
    },

    lit<V>(value: V): RawBuilder<V> {
      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithChild(ValueNode.createImmediate(value)),
      })
    },

    literal<V>(value: V): RawBuilder<V> {
      return this.lit(value)
    },

    raw<R = unknown>(sql: string): RawBuilder<R> {
      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithSql(sql),
      })
    },

    join(
      array: readonly unknown[],
      separator: RawBuilder<any> = sql`, `
    ): RawBuilder<unknown> {
      const nodes = new Array<OperationNode>(2 * array.length - 1)
      const sep = separator.toOperationNode()

      for (let i = 0; i < array.length; ++i) {
        nodes[2 * i] = parseValueExpression(array[i])

        if (i !== array.length - 1) {
          nodes[2 * i + 1] = sep
        }
      }

      return createRawBuilder({
        queryId: createQueryId(),
        rawNode: RawNode.createWithChildren(nodes),
      })
    },
  }
)
