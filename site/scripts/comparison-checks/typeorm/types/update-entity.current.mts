import type { DataSource } from '#typeorm-under-test'
import { Person } from '../_setup.mts'

declare const dataSource: DataSource

dataSource
  .createQueryBuilder()
  .update(Person)
  .set({
    // @ts-expect-error first_nam is not a property of Person.
    first_nam: 'x',
  })
dataSource
  .createQueryBuilder()
  .update(Person)
  .set({
    // @ts-expect-error age takes a number or null.
    age: 'old',
  })
