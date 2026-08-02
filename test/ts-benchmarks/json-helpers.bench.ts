import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'
import {
  jsonArrayFrom,
  jsonBuildObject,
  jsonObjectFrom,
} from '../../dist/helpers/postgres.js'

// Kysely has no relations, so `jsonArrayFrom` / `jsonObjectFrom` are how
// applications load nested data. They show up once per relation, and queries
// routinely nest them two or three deep, which makes them one of the most
// repeated type-level operations in a real codebase.

declare const kysely: Kysely<DB>

console.log('json-helpers.bench.ts:\n')

bench.baseline(() => {
  return kysely.selectFrom('my_table')
})

bench('jsonArrayFrom(subquery.select(column))', () => {
  return kysely
    .selectFrom('my_table')
    .select((eb) => [
      'my_table.id',
      jsonArrayFrom(
        eb
          .selectFrom('table_0b5ac72e03509e06683edcba4b3887ab')
          .select('table_0b5ac72e03509e06683edcba4b3887ab.id')
          .whereRef(
            'table_0b5ac72e03509e06683edcba4b3887ab.id',
            '=',
            'my_table.id',
          ),
      ).as('rels'),
    ])
}).types([1622, 'instantiations'])

bench('jsonArrayFrom(subquery.selectAll(table))', () => {
  return kysely
    .selectFrom('my_table')
    .select((eb) => [
      'my_table.id',
      jsonArrayFrom(
        eb
          .selectFrom('table_0b5ac72e03509e06683edcba4b3887ab')
          .selectAll('table_0b5ac72e03509e06683edcba4b3887ab')
          .whereRef(
            'table_0b5ac72e03509e06683edcba4b3887ab.id',
            '=',
            'my_table.id',
          ),
      ).as('rels'),
    ])
}).types([2070, 'instantiations'])

bench('jsonObjectFrom(subquery.select(column))', () => {
  return kysely
    .selectFrom('my_table')
    .select((eb) => [
      'my_table.id',
      jsonObjectFrom(
        eb
          .selectFrom('table_1474a7e0348b1ca363ee4a2a5dc4a1ec')
          .select('table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id')
          .whereRef(
            'table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id',
            '=',
            'my_table.id',
          ),
      ).as('rel'),
    ])
}).types([1526, 'instantiations'])

bench('jsonArrayFrom + jsonObjectFrom in one select', () => {
  return kysely
    .selectFrom('my_table')
    .select((eb) => [
      'my_table.id',
      jsonArrayFrom(
        eb
          .selectFrom('table_0b5ac72e03509e06683edcba4b3887ab')
          .select('table_0b5ac72e03509e06683edcba4b3887ab.id')
          .whereRef(
            'table_0b5ac72e03509e06683edcba4b3887ab.id',
            '=',
            'my_table.id',
          ),
      ).as('rels'),
      jsonObjectFrom(
        eb
          .selectFrom('table_1474a7e0348b1ca363ee4a2a5dc4a1ec')
          .select('table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id')
          .whereRef(
            'table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id',
            '=',
            'my_table.id',
          ),
      ).as('rel'),
    ])
}).types([2688, 'instantiations'])

bench('jsonArrayFrom nested two deep', () => {
  return kysely.selectFrom('my_table').select((eb) => [
    'my_table.id',
    jsonArrayFrom(
      eb
        .selectFrom('table_0b5ac72e03509e06683edcba4b3887ab')
        .select((eb2) => [
          'table_0b5ac72e03509e06683edcba4b3887ab.id',
          jsonArrayFrom(
            eb2
              .selectFrom('table_1474a7e0348b1ca363ee4a2a5dc4a1ec')
              .select('table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id')
              .whereRef(
                'table_1474a7e0348b1ca363ee4a2a5dc4a1ec.id',
                '=',
                'table_0b5ac72e03509e06683edcba4b3887ab.id',
              ),
          ).as('inner'),
        ])
        .whereRef(
          'table_0b5ac72e03509e06683edcba4b3887ab.id',
          '=',
          'my_table.id',
        ),
    ).as('rels'),
  ])
}).types([2662, 'instantiations'])

bench('jsonBuildObject(refs)', () => {
  return kysely.selectFrom('my_table').select((eb) => [
    'my_table.id',
    jsonBuildObject({
      a: eb.ref('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
      b: eb.ref('my_table.col_4f84013a8b5e4c2b7529058c8fafcaa8'),
    }).as('obj'),
  ])
}).types([1578, 'instantiations'])
