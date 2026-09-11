import { bench } from '@ark/attest'
import type { ReadonlyKysely } from '../../dist/readonly/index.js'

type Person = { id: number; name: string }
declare const db: ReadonlyKysely<{ person: Person; pet: { id: number } }>
declare function acceptsPerson(db: ReadonlyKysely<{ person: Person }>): void
declare function acceptsNullableName(
  db: ReadonlyKysely<{ person: { id: number; name: string | null } }>,
): void

console.log('readonly.bench.ts:\n')

bench.baseline(() => {})

bench('ReadonlyKysely passed to a function requiring fewer tables', () => {
  return acceptsPerson(db)
}).types([73921, 'instantiations'])

bench('ReadonlyKysely passed to a function accepting nullable reads', () => {
  return acceptsNullableName(db)
}).types([73921, 'instantiations'])
