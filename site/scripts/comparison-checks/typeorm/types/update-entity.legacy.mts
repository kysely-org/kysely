import type { DataSource, UpdateQueryBuilder } from '#typeorm-under-test'
import { Person, expectType, type IsAny } from '../_setup.mts'

declare const dataSource: DataSource

const builder = dataSource.createQueryBuilder().update(Person)
expectType<
  typeof builder extends UpdateQueryBuilder<infer Entity> ? IsAny<Entity> : false
>()
builder.set({ first_nam: 'x', age: 'old' })
