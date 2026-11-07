import { bench } from '@ark/attest'
import type { Database } from '../typings/shared.js'
import type { ExpressionBuilder } from '../../dist/index.js'
import type { jsonBuildObject as JsonBuildObject } from '../../dist/helpers/postgres.js'

declare const eb: ExpressionBuilder<Database, 'person_metadata'>
declare const jsonBuildObject: typeof JsonBuildObject

console.log('json-path.bench.ts:\n')

bench.baseline(() => {
  eb.ref('website', '->>')
  eb.ref('nicknames', '->>')
  eb.ref('profile', '->')
})

bench('eb.ref(->>).key()', () => eb.ref('website', '->>').key('url')).types([
  45,
  'instantiations',
])

bench('eb.ref(->>).at()', () => eb.ref('nicknames', '->>').at(0)).types([
  54,
  'instantiations',
])

bench('eb.ref(->).key().at().key()', () =>
  eb.ref('profile', '->').key('addresses').at(0).key('city'),
).types([146, 'instantiations'])

bench('jsonBuildObject({ inline key(), at() })', () =>
  jsonBuildObject({
    url: eb.ref('website', '->>').key('url'),
    first_nickname: eb.ref('nicknames', '->>').at(0),
  }),
).types([164, 'instantiations'])
