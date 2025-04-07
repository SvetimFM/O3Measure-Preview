# O3Measure Testing Suite

This directory contains unit tests for the O3Measure application. The tests are written using [Vitest](https://vitest.dev/), a modern test framework for Vite projects.

## Testing Structure

- `/tests/setup.js` - Global test setup that mocks browser globals (THREE.js, AFRAME)
- `/tests/unit/utils/` - Tests for utility functions and classes
- `/tests/unit/components/` - Tests for A-Frame components
- `/tests/unit/state/` - Tests for state management
- `/tests/unit/webxr/` - Tests for WebXR and A-Frame integration

## Running Tests

To run the tests, use the following commands:

```bash
# Run tests once
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Organization

Tests are organized to mirror the source directory structure. Each utility module or component has a corresponding test file.

### Core Utilities Tests

- `geometry.test.js` - Tests for 3D geometry functions
- `three-utils.test.js` - Tests for THREE.js utility functions
- `wall.test.js` - Tests for Wall class and related functionality
- `hangable-object.test.js` - Tests for HangableObject class
- `component-mixin.test.js` - Tests for the A-Frame component mixin

### Testing Approach

Tests follow these principles:

1. **Isolation** - Each test should be self-contained and not depend on other tests
2. **Completeness** - Tests should cover the full functionality of each module
3. **Edge Cases** - Tests should verify behavior with both valid and invalid inputs
4. **Mock Dependencies** - External dependencies (THREE.js, AFRAME) are mocked to isolate the unit under test

### Mocking A-Frame

Since A-Frame is a DOM-based library, we mock its functionality in `setup.js` to allow testing in a Node.js environment. The most important mock is the THREE.js global object, which is imported directly from the `three` package.

## Adding New Tests

When adding new tests:

1. Create a test file matching the source file name (e.g., `utils/myutil.js` → `tests/unit/myutil.test.js`)
2. Import the module to test and any necessary utilities
3. Use `describe` blocks to organize tests into logical sections
4. Use `beforeEach` to set up common test fixtures
5. Write individual test cases with `it` that make specific assertions

Example:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../../src/utils/myutil.js';

describe('myFunction', () => {
  it('returns expected value for valid input', () => {
    const result = myFunction(validInput);
    expect(result).toBe(expectedOutput);
  });
  
  it('throws error for invalid input', () => {
    expect(() => myFunction(invalidInput)).toThrow();
  });
})
```