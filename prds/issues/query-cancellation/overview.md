# Query Cancellation Support for Kysely

## Implementation Status

**Phase 1 Core Infrastructure: ✅ COMPLETED**
- QueryCancelledError class implementation ✅
- DatabaseConnection interface extensions ✅  
- QueryExecutor interface extensions ✅
- QueryExecutorBase implementation ✅

**Phase 2 PostgreSQL Implementation: ✅ COMPLETED**
- PostgreSQL executeQuery cancellation with Promise.race ✅
- PostgreSQL streamQuery cancellation with abort checks ✅
- Connection pool compatibility maintained ✅

**Current Status**: Ready to proceed with Phase 3 (Query Builder Integration)

**Compatibility Note**: Implementation is fully compatible with PR #176 changes that added `queryId` to `CompiledQuery` and updated transformer methods. Our interface extensions work seamlessly with the existing `queryId` parameter structure.

---

## Overview

Implement query cancellation support in Kysely using AbortSignal, allowing users to cancel long-running database queries for both streaming and non-streaming operations. This addresses GitHub issue #783 and provides a crucial feature for production applications that need to manage resource usage and user experience.

## Problem Statement

Currently, Kysely has no mechanism to cancel queries once they've been started. This creates several issues:

1. **Resource Waste**: Long-running analytical queries continue consuming database resources even when users are no longer interested in the results
2. **Poor User Experience**: Users cannot cancel queries when they navigate away from pages or change their mind
3. **Cost Management**: In cloud databases (like Snowflake mentioned in the original issue), unnecessary query execution leads to increased costs
4. **Memory Leaks**: Streaming queries that cannot be properly cancelled may cause resource leaks

## Solution Overview

Implement a bottom-up approach starting with PostgreSQL, extending the core `DatabaseConnection` interface to support query cancellation, then propagating this support through the query execution stack to the user-facing query builder APIs.

### Technical Approach

**Phase 1: Core Infrastructure (PostgreSQL)**
- Extend `DatabaseConnection` interface with optional cancellation support
- Implement PostgreSQL-specific cancellation using connection-level cancellation
- Add `QueryCancelledError` for consistent error handling
- Update `QueryExecutor` to pass AbortSignal through execution pipeline

**Phase 2: User API**
- Add optional `signal` parameter to query builder execution methods
- Support both execute and stream operations
- Maintain backward compatibility

**Phase 3: Additional Dialects**
- Extend to MSSQL (leveraging existing `#cancelRequest` infrastructure)
- Optional support for other dialects as feasible

## Detailed Implementation Plan

### 1. Core Interface Changes

#### DatabaseConnection Interface Extension
```typescript
export interface DatabaseConnection {
  executeQuery<R>(
    compiledQuery: CompiledQuery, 
    options?: { signal?: AbortSignal }
  ): Promise<QueryResult<R>>
  
  streamQuery<R>(
    compiledQuery: CompiledQuery,
    chunkSize?: number,
    options?: { signal?: AbortSignal }
  ): AsyncIterableIterator<QueryResult<R>>
}
```

#### QueryExecutor Interface Extension
```typescript
export interface QueryExecutor {
  executeQuery<R>(
    compiledQuery: CompiledQuery<R>,
    queryId: QueryId,
    options?: { signal?: AbortSignal }
  ): Promise<QueryResult<R>>

  stream<R>(
    compiledQuery: CompiledQuery<R>,
    chunkSize: number,
    queryId: QueryId,
    options?: { signal?: AbortSignal }
  ): AsyncIterableIterator<QueryResult<R>>
}
```

### 2. Error Handling

#### New Error Class
```typescript
export class QueryCancelledError extends Error {
  constructor(message = 'Query was cancelled') {
    super(message)
    this.name = 'QueryCancelledError'
  }
}
```

**Rationale**: Follows Kysely's existing error hierarchy pattern (similar to `NoResultError`) rather than using web platform `DOMException`.

### 3. PostgreSQL Implementation Strategy

Since node-postgres doesn't currently support AbortSignal (open issue #2774), we'll implement connection-level cancellation:

#### Approach A: Connection-Level Cancellation (Recommended)
- Use PostgreSQL's native query cancellation protocol
- Maintain a map of active queries to their connection contexts
- Cancel queries by terminating the specific connection when AbortSignal fires
- Handle connection cleanup and re-establishment gracefully

#### Approach B: Promise.race Pattern with Timeout
- Implement timeout-based cancellation using Promise.race
- Less elegant but more universally supported
- Higher resource usage due to incomplete cancellation

**Recommendation**: Implement Approach A for PostgreSQL as it provides true cancellation and better resource management.

### 4. User-Facing API

#### Query Builder Execution Methods
```typescript
// Non-streaming queries
.execute({ signal: abortSignal })
.executeTakeFirst({ signal: abortSignal })
.executeTakeFirstOrThrow({ signal: abortSignal })

// Streaming queries  
.stream(chunkSize, { signal: abortSignal })
```

#### Streaming Behavior on Cancellation
- Immediately stop yielding new chunks when AbortSignal is aborted
- Ensure connection cleanup in `finally` block (consistent with current behavior)
- Throw `QueryCancelledError`

### 5. Implementation Phases

#### Phase 1: PostgreSQL Foundation (Week 1-2)
1. Add optional cancellation parameters to core interfaces
2. Implement PostgreSQL connection-level cancellation
3. Add QueryCancelledError class
4. Update QueryExecutorBase to handle cancellation options
5. Basic unit tests for cancellation functionality

#### Phase 2: Query Builder Integration (Week 3)
1. Update all query builders (Select, Insert, Update, Delete) execute methods
2. Update streaming methods across all query builders
3. Comprehensive integration tests
4. Documentation updates

#### Phase 3: MSSQL Support (Week 4)
1. Leverage existing `#cancelRequest` infrastructure in MSSQL driver
2. Implement MSSQL-specific cancellation logic
3. Cross-dialect testing

#### Phase 4: Documentation & Examples (Week 5)
1. Update API documentation
2. Add cancellation examples to docs
3. Migration guide for users

## Acceptance Criteria

### Core Functionality
- [ ] `DatabaseConnection` interface supports optional `signal` parameter
- [ ] PostgreSQL driver implements query cancellation using connection-level approach
- [ ] `QueryCancelledError` is thrown when queries are cancelled
- [ ] Query builders accept `{ signal: AbortSignal }` options parameter
- [ ] Streaming queries properly handle cancellation and cleanup connections
- [ ] Backward compatibility maintained (all existing APIs work unchanged)

### PostgreSQL-Specific
- [ ] Non-streaming queries can be cancelled mid-execution
- [ ] Streaming queries can be cancelled mid-stream with proper cleanup
- [ ] Connection pooling works correctly with cancelled queries
- [ ] Cancelled connections are properly cleaned up and returned to pool

### Error Handling
- [ ] `QueryCancelledError` thrown when `AbortSignal` is aborted
- [ ] Error includes descriptive message
- [ ] Cancellation during different phases (compilation, execution, streaming) handled correctly

### Testing
- [ ] Unit tests for cancellation in isolation
- [ ] Integration tests with real PostgreSQL instance
- [ ] Performance tests ensure cancellation doesn't impact normal query performance
- [ ] Memory leak tests for streaming cancellation

### Documentation
- [ ] API documentation updated with cancellation examples
- [ ] Migration guide for existing users
- [ ] Best practices for using cancellation in production

## Technical Considerations

### Performance Impact
- Cancellation infrastructure should have minimal overhead for non-cancelled queries
- AbortSignal checks should be strategically placed to avoid performance degradation
- Connection pooling behavior must remain efficient

### Memory Management
- Ensure proper cleanup of event listeners on AbortSignal
- Prevent memory leaks in streaming scenarios
- Proper connection lifecycle management

### Error Propagation
- Cancellation errors should be distinguishable from other query errors
- Clear error messages that help developers understand what happened
- Consistent error handling across all query types

### Compatibility
- Optional cancellation support for dialects (graceful degradation)
- Backward compatibility with existing code
- Future-proof design for additional dialect support

## Testing Strategy

### Unit Tests
- `QueryCancelledError` creation and properties
- AbortSignal handling in query executors
- Connection cleanup logic

### Integration Tests
- End-to-end cancellation with PostgreSQL
- Streaming query cancellation
- Connection pool behavior with cancellation
- Cross-dialect consistency (when MSSQL is added)

### Performance Tests
- Query execution performance with and without AbortSignal
- Memory usage during cancellation scenarios
- Connection pool performance under cancellation load

## Migration Path

### For Library Users
- **No breaking changes**: Existing code continues to work unchanged
- **Opt-in feature**: Users can gradually adopt cancellation where needed
- **Clear examples**: Documentation provides common usage patterns

### For Dialect Authors
- **Optional implementation**: Cancellation support is optional for custom dialects
- **Clear interface**: Well-defined `DatabaseConnection` contract for cancellation
- **Graceful fallback**: Non-supporting dialects simply ignore cancellation

## Future Considerations

### Additional Dialects
- MySQL: Research mysql2 driver cancellation capabilities
- SQLite: Evaluate if cancellation makes sense for file-based database
- Custom dialects: Provide guidance for implementing cancellation

### Advanced Features
- Query prioritization using cancellation
- Cascading cancellation for related queries
- Integration with request-level cancellation in web frameworks

### Performance Optimizations
- Batched query cancellation
- Smart connection reuse after cancellation
- Predictive cancellation based on query patterns

## Success Metrics

### Functionality
- Query cancellation works reliably across supported dialects
- No regression in existing functionality
- Comprehensive test coverage (>95%)

### Performance  
- <1% overhead for non-cancelled queries
- Cancelled queries release resources within 100ms
- No memory leaks in cancellation scenarios

### Developer Experience
- Clear, consistent API across all query types
- Helpful error messages and documentation
- Easy integration with existing codebases

## Resources Required

### Development Time
- **PostgreSQL Implementation**: 2-3 weeks
- **MSSQL Integration**: 1 week  
- **Documentation & Testing**: 1-2 weeks
- **Total**: 4-6 weeks for initial implementation

### Testing Infrastructure
- PostgreSQL test instances for cancellation testing
- MSSQL test instances for secondary dialect support
- Performance testing environment
- Memory profiling tools

## Risk Assessment

### Technical Risks
- **Medium**: node-postgres lack of native AbortSignal support requires custom implementation
- **Low**: Connection pool interaction complexity
- **Low**: Performance impact on normal queries

### Mitigation Strategies
- Implement comprehensive testing with real database instances
- Performance benchmarking at each development phase
- Gradual rollout with optional feature flags

### Timeline Risks
- **Medium**: PostgreSQL cancellation complexity may require additional research
- **Low**: MSSQL integration should be straightforward given existing infrastructure

## Testing Strategy

### Overview

Testing will follow Kysely's existing patterns using the established test infrastructure in `test/node/src/`. Tests will be structured to run across all supported dialects where applicable, with dialect-specific tests for cancellation features.

### Test Structure

#### 1. Unit Tests

**File**: `test/node/src/query-cancellation.test.ts`
- Test `QueryCancelledError` class creation and properties
- Test AbortSignal handling in isolation
- Mock database connections to test cancellation logic
- Verify error propagation through the execution stack

**File**: `test/node/src/abort-signal.test.ts`
- Test AbortSignal integration with query executors
- Test backward compatibility with existing execution methods
- Test options parameter handling in core interfaces

#### 2. Integration Tests

**File**: `test/node/src/query-cancellation-integration.test.ts`

Structure following existing patterns:
```typescript
for (const dialect of DIALECTS.filter(d => ['postgres', 'mssql'].includes(d))) {
  describe(`${dialect}: query cancellation`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    // Test cases here...
  })
}
```

**Test Cases**:
- SELECT query cancellation (before execution, during execution)
- INSERT/UPDATE/DELETE query cancellation
- Streaming query cancellation with proper connection cleanup
- Connection pool behavior with cancelled queries
- AbortSignal timing tests (immediate, delayed, after completion)
- Error handling and QueryCancelledError throwing

#### 3. Streaming Cancellation Tests

**File**: `test/node/src/stream-cancellation.test.ts`

Following the pattern from existing `stream.test.ts`:
- Test streaming cancellation with different chunk sizes
- Test connection cleanup when streams are cancelled mid-iteration
- Test memory leak prevention during cancellation
- Test that cancelled streams properly release database resources

#### 4. Performance Tests

**File**: `test/node/src/cancellation-performance.test.ts`
- Measure overhead of AbortSignal parameter for non-cancelled queries
- Test cancellation response time
- Memory usage monitoring during cancellation scenarios
- Connection pool performance under cancellation load

#### 5. Dialect-Specific Tests

**PostgreSQL Tests** (`postgres` dialect only):
- Connection-level cancellation mechanism tests
- Pool behavior with cancelled connections
- Cursor cancellation for streaming queries

**MSSQL Tests** (`mssql` dialect only):
- Integration with existing `#cancelRequest` infrastructure
- Tedious driver cancellation behavior
- Request pause/resume interaction with cancellation

### Test Implementation Strategy

#### Phase 1: Core Unit Tests
1. **QueryCancelledError Tests**:
   ```typescript
   describe('QueryCancelledError', () => {
     it('should create error with default message', () => {
       const error = new QueryCancelledError()
       expect(error.name).to.equal('QueryCancelledError')
       expect(error.message).to.equal('Query was cancelled')
     })

     it('should create error with custom message', () => {
       const error = new QueryCancelledError('Custom cancellation message')
       expect(error.message).to.equal('Custom cancellation message')
     })
   })
   ```

2. **Interface Tests**:
   - Test that optional parameters don't break existing calls
   - Test that AbortSignal is properly passed through execution stack
   - Mock database connections to verify cancellation logic

#### Phase 2: Integration Tests with Real Databases
1. **Basic Cancellation Tests**:
   ```typescript
   it('should cancel a SELECT query when signal is aborted', async () => {
     const controller = new AbortController()
     
     const queryPromise = ctx.db
       .selectFrom('person')
       .selectAll()
       .execute({ signal: controller.signal })
     
     // Cancel immediately
     controller.abort()
     
     await expect(queryPromise).to.be.rejectedWith(QueryCancelledError)
   })
   ```

2. **Streaming Cancellation Tests**:
   ```typescript
   it('should cancel streaming query and cleanup connection', async () => {
     const controller = new AbortController()
     
     try {
       const stream = ctx.db
         .selectFrom('person')
         .selectAll()
         .stream(100, { signal: controller.signal })
       
       // Start consuming stream
       for await (const row of stream) {
         controller.abort() // Cancel mid-stream
         break
       }
     } catch (error) {
       expect(error).to.be.instanceOf(QueryCancelledError)
     }
   })
   ```

#### Phase 3: Performance and Memory Tests
1. **Overhead Measurement**:
   ```typescript
   it('should have minimal overhead for non-cancelled queries', async () => {
     const startTime = performance.now()
     
     // Run queries without cancellation
     for (let i = 0; i < 100; i++) {
       await ctx.db.selectFrom('person').selectAll().execute()
     }
     
     const withoutSignalTime = performance.now() - startTime
     
     // Run queries with AbortSignal but no cancellation
     const controller = new AbortController()
     const startTimeWithSignal = performance.now()
     
     for (let i = 0; i < 100; i++) {
       await ctx.db.selectFrom('person').selectAll().execute({ signal: controller.signal })
     }
     
     const withSignalTime = performance.now() - startTimeWithSignal
     
     // Overhead should be less than 1%
     expect(withSignalTime / withoutSignalTime).to.be.lessThan(1.01)
   })
   ```

2. **Memory Leak Tests**:
   ```typescript
   it('should not leak memory when cancelling multiple queries', async () => {
     for (let i = 0; i < POOL_SIZE * 2; i++) {
       const controller = new AbortController()
       
       const queryPromise = ctx.db
         .selectFrom('person')
         .selectAll()
         .execute({ signal: controller.signal })
       
       controller.abort()
       
       try {
         await queryPromise
       } catch (error) {
         expect(error).to.be.instanceOf(QueryCancelledError)
       }
     }
     
     // Verify pool is still healthy
     const result = await ctx.db.selectFrom('person').selectAll().execute()
     expect(result).to.be.an('array')
   })
   ```

#### Phase 4: Cross-Dialect Compatibility Tests
1. **Graceful Degradation**:
   ```typescript
   // Test that dialects without cancellation support ignore the signal
   if (dialect === 'mysql' || dialect === 'sqlite') {
     it('should ignore AbortSignal in unsupported dialects', async () => {
       const controller = new AbortController()
       controller.abort()
       
       // Should complete normally despite aborted signal
       const result = await ctx.db
         .selectFrom('person')
         .selectAll()
         .execute({ signal: controller.signal })
       
       expect(result).to.be.an('array')
     })
   }
   ```

### Test Utilities

#### Custom Test Helpers
```typescript
// Helper for timeout-based cancellation testing
export function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

// Helper for testing connection cleanup
export async function waitForConnectionCleanup(ctx: TestContext): Promise<void> {
  // Implementation to verify connections are properly returned to pool
}

// Helper for long-running query simulation
export function createLongRunningQuery(ctx: TestContext) {
  return ctx.db.selectFrom('person').select(eb => [
    eb.fn('pg_sleep', [1]).as('sleep') // PostgreSQL
    // Add dialect-specific sleep functions
  ])
}
```

#### Timing Test Utilities
```typescript
export async function measureCancellationTime(
  queryFn: () => Promise<any>,
  cancelAfterMs: number
): Promise<number> {
  const controller = new AbortController()
  const startTime = performance.now()
  
  setTimeout(() => controller.abort(), cancelAfterMs)
  
  try {
    await queryFn()
  } catch (error) {
    if (error instanceof QueryCancelledError) {
      return performance.now() - startTime - cancelAfterMs
    }
    throw error
  }
  
  throw new Error('Query was not cancelled')
}
```

### Test Environment Requirements

#### Database Setup
- PostgreSQL test instance with appropriate test data
- MSSQL test instance for secondary dialect testing
- Large enough datasets to test meaningful cancellation scenarios
- Connection pools configured for testing resource cleanup

#### Performance Testing Environment
- Consistent test environment for performance measurements
- Memory profiling tools for leak detection
- High-resolution timing capabilities

### Continuous Integration

#### Test Matrix
- Run cancellation tests across all supported Node.js versions
- Test with different PostgreSQL and MSSQL versions
- Performance regression testing on each commit
- Memory leak detection in CI pipeline

#### Test Organization
```
test/node/src/
├── query-cancellation.test.ts           # Core unit tests
├── abort-signal.test.ts                 # AbortSignal integration tests
├── query-cancellation-integration.test.ts # Full integration tests
├── stream-cancellation.test.ts          # Streaming-specific tests
├── cancellation-performance.test.ts     # Performance tests
└── cancellation-dialects.test.ts        # Dialect-specific tests
```

### Success Criteria for Testing

#### Coverage Requirements
- 100% code coverage for cancellation-related code
- All query builder methods tested with cancellation
- All supported dialects tested where cancellation is supported
- Error paths and edge cases covered

#### Performance Requirements
- No more than 1% overhead for non-cancelled queries
- Cancellation response time under 100ms
- No memory leaks in any cancellation scenario
- Connection pool remains healthy after cancellation events

#### Reliability Requirements
- Tests pass consistently across all environments
- No flaky tests due to timing issues
- Resource cleanup verified in all scenarios
- Backward compatibility maintained

## Conclusion

This implementation provides a solid foundation for query cancellation in Kysely, starting with PostgreSQL and designed for future expansion. The bottom-up approach ensures proper architectural integration while maintaining backward compatibility and performance characteristics. The optional nature of cancellation support allows for gradual adoption and dialect-specific implementation strategies.

The comprehensive testing strategy ensures that the feature works reliably across different scenarios while maintaining Kysely's high standards for performance and stability. By following the established testing patterns and infrastructure, we can confidently integrate this feature without disrupting existing functionality. 