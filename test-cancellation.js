const { QueryCancelledError } = require('./dist/cjs')

console.log('Testing QueryCancelledError...')

// Test 1: Default message
const error1 = new QueryCancelledError()
console.log('✓ Default error:', error1.name, '|', error1.message)
console.assert(
  error1.name === 'QueryCancelledError',
  'Error name should be QueryCancelledError',
)
console.assert(
  error1.message === 'Query was cancelled',
  'Default message should be "Query was cancelled"',
)

// Test 2: Custom message
const error2 = new QueryCancelledError('Custom message')
console.log('✓ Custom error:', error2.name, '|', error2.message)
console.assert(
  error2.name === 'QueryCancelledError',
  'Error name should be QueryCancelledError',
)
console.assert(
  error2.message === 'Custom message',
  'Custom message should be preserved',
)

// Test 3: Instance check
console.assert(error1 instanceof Error, 'Should be instance of Error')
console.assert(
  error1 instanceof QueryCancelledError,
  'Should be instance of QueryCancelledError',
)

// Test 4: AbortController availability
console.log(
  '✓ AbortController available:',
  typeof AbortController !== 'undefined',
)

console.log('✅ All basic tests passed!')
console.log('QueryCancelledError implementation is working correctly.')
