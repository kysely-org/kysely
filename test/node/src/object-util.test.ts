import { isPlainObject } from '../../../dist/cjs/util/object-utils'

import { expect } from './test-setup.js'

describe('object util', () => {
  it('isPlainObject', async () => {
    class SomeClass {}

    for (const obj of [{ foo: 'bar' }, Object.create(null)]) {
      expect(isPlainObject(obj)).to.equal(true)
    }

    for (const obj of [
      [],
      new Date(),
      Buffer.allocUnsafe(10),
      new ArrayBuffer(10),
      new Int32Array(10),
      new Float64Array(10),
      '',
      42,
      false,
      null,
      undefined,
      new SomeClass(),
    ]) {
      expect(isPlainObject(obj)).to.equal(false)
    }
  })
})
