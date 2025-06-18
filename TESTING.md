# Testing Documentation

This document provides comprehensive information about the testing setup and strategies for the fullstack feedback application.

## Overview

The project includes comprehensive test suites for both backend (Flask API) and frontend (React) components:

- **Backend Tests**: Python with pytest for API endpoints and database operations
- **Frontend Tests**: JavaScript with Jest and React Testing Library for component behavior
- **Integration Tests**: End-to-end workflow testing between frontend and backend

## Project Structure

```
fullstack_test/
├── backend/
│   ├── test_app.py              # Comprehensive backend tests
│   ├── pytest.ini              # Pytest configuration
│   └── requirements.txt         # Including test dependencies
├── frontend/
│   ├── src/
│   │   ├── App.test.js          # Main component tests
│   │   ├── __tests__/
│   │   │   └── integration.test.js  # Integration tests
│   │   └── utils/
│   │       └── testUtils.js     # Test utilities and helpers
│   ├── jest.config.js           # Jest configuration
│   └── package.json             # Including test scripts
└── TESTING.md                   # This documentation
```

## Backend Testing

### Setup

The backend uses `pytest` with Flask testing utilities. Key dependencies:

```python
pytest==7.4.3
pytest-flask==1.3.0
pytest-cov==4.1.0
```

### Test Categories

#### 1. API Endpoint Tests (`TestGetFeedback`, `TestPostFeedback`)
- **GET /feedback**: Filtering, sorting, pagination, error handling
- **POST /feedback**: Data validation, success/error responses

#### 2. Database Tests (`TestDatabaseOperations`)
- Database initialization and table creation
- Data persistence and retrieval

#### 3. CORS and Headers Tests (`TestCORSAndHeaders`)
- Cross-origin request handling
- HTTP headers validation

#### 4. Edge Cases (`TestEdgeCases`)
- Boundary value testing
- Error condition handling
- Large data handling

### Running Backend Tests

```bash
cd fullstack_test/backend

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test class
pytest test_app.py::TestGetFeedback

# Run with verbose output
pytest -v

# Run tests matching pattern
pytest -k "test_post_feedback"
```

### Test Database

Tests use a separate SQLite database (`test_feedback.db`) that is:
- Created fresh for each test session
- Automatically cleaned up after tests
- Isolated from the main application database

## Frontend Testing

### Setup

The frontend uses Jest with React Testing Library and custom utilities:

```javascript
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
```

### Test Categories

#### 1. Component Rendering Tests
- Initial render validation
- UI element presence
- Accessibility compliance

#### 2. User Interaction Tests
- Form input handling
- Button click events
- Filter interactions

#### 3. API Integration Tests
- Fetch call validation
- Response handling
- Error scenarios

#### 4. State Management Tests
- Component state updates
- Form state persistence
- Filter state management

### Running Frontend Tests

```bash
cd fullstack_test/frontend

# Install dependencies
npm install

# Run tests in watch mode
npm test

# Run all tests once
npm run test:ci

# Run with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Debug tests
npm run test:debug
```

### Test Utilities

The `testUtils.js` file provides:

```javascript
// Custom render with providers
renderWithProviders(component, options)

// Mock API responses
mockFetchResponse(data, ok, status)
mockFetchError(errorMessage)

// Sample data generators
createSampleFeedback(overrides)
createSampleFeedbackList(count)

// Test helpers
mockDate(dateString)
mockConsole()
mockAlert()
```

## Integration Testing

Integration tests verify the complete workflow between frontend and backend:

### Test Scenarios

1. **Complete User Workflow**
   - View feedback list
   - Apply filters
   - Add new feedback
   - Verify updated list

2. **API Communication**
   - Correct query parameter formatting
   - Proper request/response handling
   - Error handling and recovery

3. **Real-world Edge Cases**
   - Rapid filter changes
   - Network interruptions
   - Large data sets

### Mock Strategy

Integration tests use comprehensive mocking:

```javascript
// Mock fetch with conditional responses
mockFetch.mockImplementation((url, options) => {
  if (options?.method === 'POST') {
    return mockFetchResponse({ status: 'ok' });
  }
  if (url.includes('rating=5')) {
    return mockFetchResponse(filteredData);
  }
  return mockFetchResponse(allData);
});
```

## Test Coverage

### Coverage Targets

- **Backend**: 80% minimum coverage
- **Frontend**: 80% minimum coverage for branches, functions, lines, and statements

### Coverage Reports

Backend coverage:
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

Frontend coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

### Test Scripts for CI

Backend:
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests with coverage
pytest --cov=app --cov-report=xml --cov-fail-under=80
```

Frontend:
```bash
# Install dependencies
npm ci

# Run tests
npm run test:ci
```

### Environment Setup

Tests require:
- Python 3.8+
- Node.js 16+
- SQLite (for backend tests)

## Best Practices

### Writing Tests

1. **Descriptive Test Names**
   ```javascript
   test('submits feedback with correct API payload', async () => {
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   // Arrange
   const mockData = createSampleFeedback();
   
   // Act
   render(<App />);
   
   // Assert
   expect(screen.getByText(/feedback/i)).toBeInTheDocument();
   ```

3. **Proper Cleanup**
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
     mockFetch.mockClear();
   });
   ```

### Mock Management

1. **Centralized Mocks**: Use utilities for consistent mocking
2. **Specific Mocks**: Mock only what's necessary for each test
3. **Reset State**: Clear mocks between tests

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Shared Setup**: Use `beforeEach` for common test setup
3. **Isolated Tests**: Each test should be independent

## Debugging Tests

### Common Issues

1. **Async/Await**: Use `waitFor` for async operations
   ```javascript
   await waitFor(() => {
     expect(mockFetch).toHaveBeenCalled();
   });
   ```

2. **DOM Updates**: Use `act` for state updates
   ```javascript
   await act(async () => {
     fireEvent.click(button);
   });
   ```

3. **Mock Timing**: Ensure mocks are set up before components render

### Debug Tools

1. **Screen Debug**: `screen.debug()` to see rendered DOM
2. **Console Logs**: Strategic logging in tests
3. **Jest Debug**: Use `--inspect-brk` flag for debugging

## Performance Considerations

### Test Optimization

1. **Parallel Execution**: Tests run in parallel where possible
2. **Mock Efficiency**: Minimize expensive operations in mocks
3. **Setup Optimization**: Reuse test setup where appropriate

### Resource Management

1. **Memory**: Clean up resources after tests
2. **File System**: Remove temporary files
3. **Network**: Mock all external calls

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD approach
2. **Update Documentation**: Keep this file current
3. **Maintain Coverage**: Ensure new code is tested
4. **Review Test Quality**: Tests should be maintainable and clear

### Test Review Checklist

- [ ] Tests cover happy path and edge cases
- [ ] Tests are isolated and independent
- [ ] Test names are descriptive
- [ ] Proper async handling
- [ ] Appropriate mocking
- [ ] Coverage targets met
- [ ] Tests pass consistently

## Troubleshooting

### Common Test Failures

1. **Timeout Errors**: Increase timeout for slow operations
2. **Mock Issues**: Verify mock setup and timing
3. **Async Problems**: Use proper async/await patterns
4. **DOM Issues**: Ensure proper cleanup between tests

### Getting Help

1. Check test output for specific error messages
2. Use `screen.debug()` to inspect DOM state
3. Verify mock configurations
4. Check for async/timing issues
5. Review this documentation for patterns

---

*Last Updated: January 2024*