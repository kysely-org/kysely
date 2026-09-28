import { createCamelCaseMapper } from '../../../dist/plugin/camel-case/camel-case.js'
import { expect } from './test-setup.js'

describe('createCamelCaseMapper', () => {
  const camelCase = createCamelCaseMapper()

  it('should convert snake_case identifiers to camelCase', () => {
    expect(camelCase('id')).to.equal('id')
    expect(camelCase('first_name')).to.equal('firstName')
    expect(camelCase('a_b_c')).to.equal('aBC')
  })

  it('should leave identifiers without underscores untouched', () => {
    expect(camelCase('fooBar')).to.equal('fooBar')
    expect(camelCase('FOO')).to.equal('FOO')
  })

  // https://github.com/kysely-org/kysely/issues/1627
  //
  // A leading underscore isn't a word separator, so it must not cause the
  // character after it to be capitalized. `_id` is `_id`, not `_Id`.
  it('should not capitalize a leading-underscore identifier', () => {
    expect(camelCase('_id')).to.equal('_id')
    expect(camelCase('_foo_bar')).to.equal('_fooBar')
    expect(camelCase('_a')).to.equal('_a')
    expect(camelCase('_id_x')).to.equal('_idX')
  })

  it('should still capitalize after a leading run of underscores', () => {
    expect(camelCase('__id')).to.equal('_id')
    expect(camelCase('__a_b')).to.equal('_aB')
  })

  it('should still capitalize after interior underscores', () => {
    expect(camelCase('a_b')).to.equal('aB')
    expect(camelCase('a__b')).to.equal('aB')
    expect(camelCase('a___b')).to.equal('aB')
  })

  it('should drop underscores that have no character after them', () => {
    expect(camelCase('_')).to.equal('_')
    expect(camelCase('__')).to.equal('_')
    expect(camelCase('id_')).to.equal('id')
    expect(camelCase('foo_bar_')).to.equal('fooBar')
  })

  describe('upperCase', () => {
    const upper = createCamelCaseMapper({ upperCase: true })

    it('should convert SNAKE_CASE to camelCase', () => {
      expect(upper('ID')).to.equal('id')
      expect(upper('FOO_BAR')).to.equal('fooBar')
    })

    it('should not capitalize a leading-underscore identifier', () => {
      expect(upper('_id')).to.equal('_id')
      expect(upper('_FOO_BAR')).to.equal('_fooBar')
    })
  })
})
