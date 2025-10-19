# Unit Tests

## Test Coverage

### Utilities (3 test files)

- `pathResolver.test.ts` - Path resolution logic (7 tests)
- `formatters.test.ts` - Date formatting & detection (8 tests)
- `configHelpers.test.ts` - Smart config generation (10 tests)
- `iconHelpers.test.ts` - Icon validation (3 tests)

### Hooks (1 test file)

- `hooks.test.tsx` - useSearch, useSort, useGroupBy integration tests (8 tests)

**Total:** 37 unit tests ✅ **ALL PASSING**

## Running Tests

```bash
# Run all tests
npm test

# Run portfolio gadget tests only
npm test ProjectPortfolioGadget

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Strategy

### What We Test

✅ **Utilities** - Pure functions (pathResolver, formatters, configHelpers)
✅ **Hooks** - State management and logic (useSearch, useSort, useGroupBy)
✅ **Edge cases** - Null values, empty data, missing fields
✅ **Integration** - How hooks work together

### What We Don't Test (Yet)

⚠️ **Components** - Presentational components (tested via E2E in future)
⚠️ **Data fetching** - useDataSource (mocked in integration tests)
⚠️ **Navigation** - Context interactions

## Coverage Goals

- **Utilities:** 100% coverage ✅
- **Hooks:** 90%+ coverage ✅
- **Overall:** 80%+ coverage target

## Test Philosophy

- **Unit tests** for logic and utilities
- **Integration tests** for hooks
- **E2E tests** for full user flows (future)
- **No mocking** where possible (real implementations)
- **Fast execution** (< 1 second total)
