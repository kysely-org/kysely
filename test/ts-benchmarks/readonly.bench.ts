import { bench } from '@ark/attest'
import type {
  ReadonlyKysely,
  ReadonlyTransaction,
  ReadonlyControlledTransaction,
} from '../../dist/readonly/index.js'

type Person = { id: number; name: string }
declare const transaction: ReadonlyTransaction<{
  person: Person
  pet: { id: number }
}>
declare const controlled: ReadonlyControlledTransaction<
  { person: Person; pet: { id: number } },
  ['s']
>
declare const db: ReadonlyKysely<{ person: Person; pet: { id: number } }>
declare function acceptsPerson(db: ReadonlyKysely<{ person: Person }>): void
declare function acceptsNullableName(
  db: ReadonlyKysely<{ person: { id: number; name: string | null } }>,
): void

console.log('readonly.bench.ts:\n')

bench.baseline(() => {})

bench('ReadonlyKysely passed to a function requiring fewer tables', () => {
  return acceptsPerson(db)
}).types([52001, 'instantiations'])

bench('ReadonlyKysely passed to a function accepting nullable reads', () => {
  return acceptsNullableName(db)
}).types([52076, 'instantiations'])

bench('ReadonlyTransaction passed to a function requiring fewer tables', () => {
  return acceptsPerson(transaction)
}).types([47743, 'instantiations'])

bench(
  'ReadonlyTransaction passed to a function accepting nullable reads',
  () => {
    return acceptsNullableName(transaction)
  },
).types([47818, 'instantiations'])

bench(
  'ReadonlyControlledTransaction passed to a function requiring fewer tables',
  () => {
    return acceptsPerson(controlled)
  },
).types([47779, 'instantiations'])

bench(
  'ReadonlyControlledTransaction passed to a function accepting nullable reads',
  () => {
    return acceptsNullableName(controlled)
  },
).types([47854, 'instantiations'])
