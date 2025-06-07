# Query Cancellation Support - Implementation Plan

## Overview

This plan breaks down the query cancellation implementation into actionable tasks, organized by phases. Tasks should be completed from top to bottom within each phase to ensure proper dependency management and integration.

---

## Phase 1: Core Infrastructure & Error Handling

### 1.1 Add Error Class

- [x] **Task 1.1.1**: Create `QueryCancelledError` class in `src/util/query-cancelled-error.ts`
  - Add class extending `Error` with constructor accepting optional message
  - Set `name` property to `'QueryCancelledError'`
  - Export the class

- [x] **Task 1.1.2**: Export `QueryCancelledError` from main index file
  - Add export to `src/index.ts`
  - Add to public API documentation

### 1.2 Update Core Interfaces

- [x] **Task 1.2.1**: Extend `DatabaseConnection` interface in `src/driver/database-connection.ts`
  - Add optional `options?: { signal?: AbortSignal }` parameter to `executeQuery` method
  - Add optional `options?: { signal?: AbortSignal }` parameter to `streamQuery` method
  - Maintain backward compatibility with existing signatures

- [x] **Task 1.2.2**: Extend `QueryExecutor` interface in `src/query-executor/query-executor.ts`
  - Add optional `options?: { signal?: AbortSignal }` parameter to `executeQuery` method
  - Add optional `options?: { signal?: AbortSignal }` parameter to `stream` method
  - Update method signatures while maintaining backward compatibility

### 1.3 Update QueryExecutorBase

- [x] **Task 1.3.1**: Update `executeQuery` method in `src/query-executor/query-executor-base.ts`
  - Add optional `options` parameter to method signature
  - Pass `options` parameter to `connection.executeQuery()` call
  - Add AbortSignal check before execution and throw `QueryCancelledError` if already aborted

- [x] **Task 1.3.2**: Update `stream` method in `src/query-executor/query-executor-base.ts`
  - Add optional `options` parameter to method signature
  - Pass `options` parameter to `connection.streamQuery()` call
  - Add AbortSignal check and error handling for cancelled streams
  - Ensure connection cleanup in finally block when signal is aborted

### 1.4 Update DefaultQueryExecutor

- [x] **Task 1.4.1**: Update method signatures in `src/query-executor/default-query-executor.ts`
  - Update `executeQuery` method to accept and pass through options parameter
  - Update `stream` method to accept and pass through options parameter
  - Ensure all calls to base class methods include options parameter
  - **Note**: DefaultQueryExecutor inherits from QueryExecutorBase, so updates are automatic

---

## Phase 2: PostgreSQL Implementation

### 2.1 PostgreSQL Connection Implementation

- [x] **Task 2.1.1**: Research PostgreSQL cancellation mechanisms
  - Investigate `pg.Pool` and `pg.Client` cancellation capabilities
  - Determine best approach for connection-level cancellation
  - Document findings and chosen approach
  - **Result**: Implemented Promise.race approach due to interface limitations

- [x] **Task 2.1.2**: Implement cancellation in `PostgresConnection` class in `src/dialect/postgres/postgres-driver.ts`
  - Update `executeQuery` method to handle AbortSignal
  - Implement Promise.race cancellation when signal is aborted
  - Add proper error handling and cleanup
  - Throw `QueryCancelledError` when cancelled

- [x] **Task 2.1.3**: Implement streaming cancellation in `PostgresConnection` class
  - Update `streamQuery` method to handle AbortSignal
  - Add signal abort listener and cancellation checks
  - Ensure proper cursor cleanup when cancelled
  - Handle cancellation during different phases of streaming

### 2.2 Connection Pool Handling

- [x] **Task 2.2.1**: Update connection pool logic for cancelled connections
  - Ensure cancelled connections are properly cleaned up
  - Handle connection state after cancellation
  - Verify pool health after cancellation events
  - **Note**: Promise.race approach maintains connection integrity

---

## Phase 3: Query Builder Integration

### 3.1 Update SelectQueryBuilder

- [x] **Task 3.1.1**: Update execution methods in `src/query-builder/select-query-builder.ts`
  - Modify `execute()` method to accept optional `options?: { signal?: AbortSignal }` parameter
  - Update `executeTakeFirst()` method with options parameter
  - Update `executeTakeFirstOrThrow()` method with options parameter
  - Pass options to executor.executeQuery() calls

- [x] **Task 3.1.2**: Update streaming method in `SelectQueryBuilder`
  - Modify `stream()` method to accept optional signal parameter: `stream(chunkSize?: number, options?: { signal?: AbortSignal })`
  - Pass options to executor.stream() calls
  - Maintain backward compatibility with existing chunkSize parameter

### 3.2 Update InsertQueryBuilder

- [ ] **Task 3.2.1**: Update execution methods in `src/query-builder/insert-query-builder.ts`
  - Modify `execute()` method to accept optional options parameter
  - Update `executeTakeFirst()` method with options parameter  
  - Update `executeTakeFirstOrThrow()` method with options parameter
  - Pass options to executor calls

- [ ] **Task 3.2.2**: Update streaming method in `InsertQueryBuilder`
  - Modify `stream()` method to accept optional signal parameter
  - Pass options to executor.stream() calls

### 3.3 Update UpdateQueryBuilder

- [ ] **Task 3.3.1**: Update execution methods in `src/query-builder/update-query-builder.ts`
  - Modify `execute()` method to accept optional options parameter
  - Update `executeTakeFirst()` method with options parameter
  - Update `executeTakeFirstOrThrow()` method with options parameter
  - Pass options to executor calls

- [ ] **Task 3.3.2**: Update streaming method in `UpdateQueryBuilder`
  - Modify `stream()` method to accept optional signal parameter
  - Pass options to executor.stream() calls

### 3.4 Update DeleteQueryBuilder

- [ ] **Task 3.4.1**: Update execution methods in `src/query-builder/delete-query-builder.ts`
  - Modify `execute()` method to accept optional options parameter
  - Update `executeTakeFirst()` method with options parameter
  - Update `executeTakeFirstOrThrow()` method with options parameter
  - Pass options to executor calls

- [ ] **Task 3.4.2**: Update streaming method in `DeleteQueryBuilder`
  - Modify `stream()` method to accept optional signal parameter
  - Pass options to executor.stream() calls

### 3.5 Update Compilable and Streamable Interfaces

- [ ] **Task 3.5.1**: Update `Compilable` interface in `src/util/compilable.ts`
  - Add optional options parameter to `execute()` methods
  - Maintain backward compatibility

- [ ] **Task 3.5.2**: Update `Streamable` interface in `src/util/streamable.ts`
  - Add optional options parameter to `stream()` method
  - Update documentation with cancellation examples

---

## Phase 4: MSSQL Support (Optional Extension)

### 4.1 MSSQL Connection Implementation

- [ ] **Task 4.1.1**: Extend MSSQL cancellation in `src/dialect/mssql/mssql-driver.ts`
  - Leverage existing `#cancelRequest` infrastructure
  - Update `executeQuery` method to handle AbortSignal
  - Add signal abort listener to call existing cancellation logic

- [ ] **Task 4.1.2**: Update MSSQL streaming cancellation
  - Update `streamQuery` method to handle AbortSignal
  - Integrate with existing stream cancellation in finally block
  - Ensure proper cleanup when cancelled mid-stream

---

## Phase 5: Testing Infrastructure

### 5.1 Unit Tests

- [ ] **Task 5.1.1**: Create unit tests for `QueryCancelledError`
  - Test error creation and properties
  - Test error message handling
  - Verify error inheritance

- [ ] **Task 5.1.2**: Create unit tests for core interface changes
  - Test QueryExecutor options parameter handling
  - Test backward compatibility with existing calls
  - Mock AbortSignal behavior

### 5.2 PostgreSQL Integration Tests

- [ ] **Task 5.2.1**: Create cancellation tests in `test/node/src/`
  - Test SELECT query cancellation
  - Test INSERT/UPDATE/DELETE query cancellation
  - Test streaming query cancellation
  - Test cancellation timing (before, during, after execution)

- [ ] **Task 5.2.2**: Create connection pool tests
  - Test pool behavior with cancelled queries
  - Test connection cleanup after cancellation
  - Test pool health after multiple cancellations

### 5.3 Performance Tests

- [ ] **Task 5.3.1**: Create performance benchmark tests
  - Measure overhead of AbortSignal parameter for non-cancelled queries
  - Test cancellation response time
  - Verify no memory leaks in cancellation scenarios

### 5.4 Error Handling Tests

- [ ] **Task 5.4.1**: Create comprehensive error scenario tests
  - Test QueryCancelledError throwing
  - Test error propagation through query builders
  - Test cancellation during different execution phases

---

## Phase 6: Documentation & Examples

### 6.1 API Documentation

- [ ] **Task 6.1.1**: Update query builder documentation
  - Add cancellation examples to method documentation
  - Update JSDoc comments with options parameter
  - Add usage examples for AbortSignal

- [ ] **Task 6.1.2**: Update interface documentation
  - Document DatabaseConnection cancellation support
  - Document QueryExecutor cancellation support
  - Add cancellation best practices

### 6.2 User Guide Documentation

- [ ] **Task 6.2.1**: Create cancellation usage guide
  - Add examples for common cancellation patterns
  - Document timeout-based cancellation
  - Add user-initiated cancellation examples

- [ ] **Task 6.2.2**: Create migration guide
  - Document how to add cancellation to existing code
  - Show before/after examples
  - Address common migration questions

### 6.3 Example Code

- [ ] **Task 6.3.1**: Add cancellation examples to `example/` directory
  - Create timeout cancellation example
  - Create user-initiated cancellation example
  - Create streaming cancellation example

---

## Phase 7: Final Integration & Validation

### 7.1 Cross-Platform Testing

- [ ] **Task 7.1.1**: Run full test suite across all supported Node.js versions
  - Verify AbortSignal support across versions
  - Test with different PostgreSQL versions
  - Validate performance across platforms

### 7.2 Backward Compatibility Validation

- [ ] **Task 7.2.1**: Comprehensive backward compatibility testing
  - Verify all existing code continues to work unchanged
  - Test with real-world Kysely applications
  - Validate type safety with TypeScript strict mode

### 7.3 Documentation Review

- [ ] **Task 7.3.1**: Complete documentation review
  - Review all API documentation for accuracy
  - Validate all code examples work correctly
  - Ensure consistent terminology throughout

---

## Dependencies & Prerequisites

### Technical Dependencies
- Node.js AbortController/AbortSignal API support (Node.js 15.4.0+)
- PostgreSQL test instances for integration testing
- MSSQL test instances for dialect extension testing

### Knowledge Prerequisites  
- Understanding of PostgreSQL query cancellation mechanisms
- Familiarity with Node.js AbortSignal API patterns
- Knowledge of Kysely's architecture and query execution flow

---

## Success Criteria

Each phase is considered complete when:
- All tasks in the phase are implemented and tested
- No regressions are introduced to existing functionality
- Performance impact is within acceptable limits (<1% overhead)
- Documentation is updated and accurate
- Tests pass across all supported environments 