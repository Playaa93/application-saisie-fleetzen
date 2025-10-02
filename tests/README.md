# Testing Strategy & Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

This test suite follows a comprehensive testing pyramid approach with **80%+ code coverage** requirements:

```
         /\
        /E2E\      ← Few, high-value user flows
       /------\
      /Integr. \   ← API and database tests
     /----------\
    /   Unit     \ ← Many, fast, isolated tests
   /--------------\
```

### Testing Stack

- **Unit & Integration**: Jest + React Testing Library + ts-jest
- **E2E**: Playwright (Chromium, Firefox, WebKit)
- **Coverage**: NYC + Jest Coverage
- **Mocking**: Jest mocks + Test fixtures

## Test Structure

```
tests/
├── unit/                    # Unit tests (components, utils, hooks)
│   ├── components/          # Component unit tests
│   │   ├── FormBuilder.test.tsx
│   │   └── FormField.test.tsx
│   ├── utils/               # Utility function tests
│   │   └── validators.test.ts
│   └── hooks/               # Custom hook tests
│       └── useForm.test.ts
│
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   │   └── forms.test.ts
│   └── database/            # Database operation tests
│       └── forms.test.ts
│
├── e2e/                     # End-to-end tests
│   ├── flows/               # User flow tests
│   │   ├── form-creation.spec.ts
│   │   └── form-management.spec.ts
│   └── fixtures/            # Test data
│       ├── forms.json
│       └── submissions.json
│
├── __mocks__/               # Mock implementations
│   ├── next-router.ts
│   ├── react-dnd.ts
│   └── test-utils.tsx
│
└── config/                  # Test configuration
    └── jest.setup.ts
```

## Running Tests

### All Tests

```bash
# Run all test suites
npm run test:all

# Run with coverage
npm run test:coverage
```

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run smoke tests only
npm run test:smoke
```

### CI/CD

```bash
# Run tests in CI mode
npm run test:ci
```

## Writing Tests

### Unit Test Template

```typescript
/**
 * @test ComponentName
 * @description Clear description of what is being tested
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ComponentName />);
      expect(screen.getByTestId('component')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(<ComponentName onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      render(<ComponentName data={[]} />);
      expect(screen.getByText('No data')).toBeVisible();
    });
  });
});
```

### Integration Test Template

```typescript
/**
 * @test API Endpoint
 * @description Integration test for API functionality
 */

describe('POST /api/forms', () => {
  it('should create form with valid data', async () => {
    const formData = {
      title: 'Test Form',
      fields: [{ type: 'text', label: 'Name' }],
    };

    const response = await request(app)
      .post('/api/forms')
      .send(formData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/forms')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
```

### E2E Test Template

```typescript
/**
 * @test E2E User Flow
 * @description End-to-end test for critical user journey
 * @prerequisites
 *   - Application running on localhost:3000
 *   - Database in known state
 */

import { test, expect } from '@playwright/test';

test.describe('Form Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create form successfully', async ({ page }) => {
    await page.click('text=Create New Form');
    await page.fill('input[name="title"]', 'Test Form');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Form saved')).toBeVisible();
  });
});
```

## Coverage Requirements

### Thresholds

```json
{
  "global": {
    "statements": 80,
    "branches": 75,
    "functions": 80,
    "lines": 80
  }
}
```

### Coverage Reports

- **HTML Report**: `coverage/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Summary**: `coverage/coverage-summary.json`

### Viewing Coverage

```bash
# Generate and view coverage
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Best Practices

### ✅ DO

1. **Write Tests First (TDD)**
   ```typescript
   // Write the test
   it('should add two numbers', () => {
     expect(add(2, 3)).toBe(5);
   });

   // Then implement
   const add = (a: number, b: number) => a + b;
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => {});

   // ✅ Good
   it('should validate email format and show error for invalid input', () => {});
   ```

3. **Follow AAA Pattern**
   ```typescript
   it('should update username', () => {
     // Arrange
     const user = { name: 'John' };

     // Act
     updateName(user, 'Jane');

     // Assert
     expect(user.name).toBe('Jane');
   });
   ```

4. **Test One Thing Per Test**
   ```typescript
   // ❌ Bad - testing multiple things
   it('should work correctly', () => {
     expect(component.render()).toBeTruthy();
     expect(component.validate()).toBe(true);
     expect(component.submit()).resolves.toBe(true);
   });

   // ✅ Good - one assertion focus
   it('should render successfully', () => {
     expect(component.render()).toBeTruthy();
   });

   it('should validate input correctly', () => {
     expect(component.validate()).toBe(true);
   });
   ```

5. **Use Test Utilities**
   ```typescript
   import { render } from 'tests/__mocks__/test-utils';
   import { generateForm, generateField } from 'tests/__mocks__/test-utils';

   const mockForm = generateForm({ title: 'Test' });
   ```

### ❌ DON'T

1. **Don't Test Implementation Details**
   ```typescript
   // ❌ Bad - testing internal state
   it('should update state', () => {
     component.setState({ value: 'test' });
     expect(component.state.value).toBe('test');
   });

   // ✅ Good - testing behavior
   it('should display input value', () => {
     render(<Component />);
     userEvent.type(screen.getByRole('textbox'), 'test');
     expect(screen.getByDisplayValue('test')).toBeInTheDocument();
   });
   ```

2. **Don't Share State Between Tests**
   ```typescript
   // ❌ Bad
   let user;
   beforeAll(() => {
     user = createUser();
   });

   // ✅ Good
   beforeEach(() => {
     const user = createUser();
   });
   ```

3. **Don't Skip Error Cases**
   ```typescript
   it('should handle API errors gracefully', async () => {
     mockApi.get.mockRejectedValue(new Error('Network error'));

     await expect(fetchData()).rejects.toThrow('Network error');
   });
   ```

### Testing Patterns

#### Testing Async Operations

```typescript
it('should fetch data successfully', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Or with waitFor
import { waitFor } from '@testing-library/react';

it('should show loading then data', async () => {
  render(<Component />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

#### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

#### Testing Error Boundaries

```typescript
it('should render error fallback on error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

## Mocking Strategies

### Mock API Calls

```typescript
// Using jest.fn()
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});

global.fetch = mockFetch;
```

### Mock Modules

```typescript
// __mocks__/api.ts
export const fetchForms = jest.fn().mockResolvedValue([]);

// In test
jest.mock('@/lib/api');
```

### Mock Next.js Router

```typescript
import { useRouter } from 'next/navigation';

jest.mock('next/navigation');

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
```

## CI/CD Integration

### GitHub Actions Workflow

The test suite runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Workflow Steps

1. **Lint & Type Check**
2. **Unit & Integration Tests** (Node 18.x, 20.x)
3. **E2E Tests** (Playwright)
4. **Coverage Upload** (Codecov)
5. **Security Audit**

### Local CI Simulation

```bash
# Run the same tests as CI
npm run test:ci
```

## Debugging Tests

### Jest Debug Mode

```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest tests/unit/components/FormBuilder.test.tsx

# Or use VS Code debugger
```

### Playwright Debug Mode

```bash
# Debug E2E tests
npm run test:e2e:debug

# Or step through in UI mode
npm run test:e2e:ui
```

### Common Issues

1. **Tests timeout**
   ```typescript
   // Increase timeout
   jest.setTimeout(10000);

   // Or per test
   it('slow test', async () => {
     // test
   }, 10000);
   ```

2. **Async errors**
   ```typescript
   // Always await async operations
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   });
   ```

3. **Element not found**
   ```typescript
   // Use findBy for async elements
   const element = await screen.findByText('Async content');

   // Or waitFor
   await waitFor(() => {
     expect(screen.getByText('Async content')).toBeInTheDocument();
   });
   ```

## Performance Testing

### Measure Component Render Time

```typescript
it('should render within performance budget', () => {
  const start = performance.now();

  render(<LargeComponent data={largeDataset} />);

  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100); // 100ms budget
});
```

### Test Bundle Size

```bash
# Analyze bundle
npm run analyze:bundle

# Check performance budget
npm run perf:check
```

## Security Testing

### Validate Input Sanitization

```typescript
it('should prevent XSS attacks', () => {
  const xssPayload = '<script>alert("XSS")</script>';

  render(<Component value={xssPayload} />);

  expect(screen.queryByText(/<script>/i)).not.toBeInTheDocument();
});
```

### Test Authentication

```typescript
it('should require authentication', async () => {
  const response = await request(app)
    .get('/api/protected')
    .expect(401);

  expect(response.body.error).toBe('Unauthorized');
});
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For questions or issues:
1. Check test logs and error messages
2. Review coverage reports
3. Consult this documentation
4. Ask the team for help

---

**Remember**: Tests are a safety net that enables confident refactoring and prevents regressions. Invest in good tests—they pay dividends in maintainability!
