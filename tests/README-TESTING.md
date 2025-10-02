# Testing Documentation - Field Agent PWA Application

## Overview

Comprehensive test suite for the Field Agent PWA application covering unit tests, integration tests, mobile E2E tests, and PWA-specific functionality.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/          # React component tests
│   │   └── PhotoUpload.test.tsx
│   └── utils/              # Utility function tests
│       ├── photo-compression.test.ts
│       └── validators.test.ts
├── integration/            # Integration tests
│   ├── api/               # API route tests
│   │   └── interventions.test.ts
│   └── database/          # Database operation tests
│       └── interventions.test.ts
├── e2e/                   # End-to-end tests
│   └── mobile/            # Mobile-specific E2E tests
│       └── mobile-workflow.spec.ts
├── pwa/                   # PWA-specific tests
│   ├── offline-mode.test.ts
│   └── installation.test.ts
├── config/                # Test configuration
│   └── jest.setup.ts
└── __mocks__/            # Mock implementations

```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### PWA Tests
```bash
npm run test:pwa
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Categories

### 1. Unit Tests

**Photo Compression** (`tests/unit/utils/photo-compression.test.ts`)
- Image dimension calculation with aspect ratio preservation
- File validation (type, size)
- Quality optimization based on file size
- Compression with various formats (JPEG, WebP, PNG)
- Edge cases (ultra-wide, ultra-tall images)
- Performance benchmarks

**Form Validation** (`tests/unit/utils/validators.test.ts`)
- Field-level validation rules
- Custom validation patterns
- Error message generation
- Required field checks

**Photo Upload Component** (`tests/unit/components/PhotoUpload.test.tsx`)
- File input rendering and interaction
- Preview generation
- Compression progress display
- Error handling
- Accessibility features

### 2. Integration Tests

**Interventions API** (`tests/integration/api/interventions.test.ts`)
- Create intervention with all fields
- Photo upload and compression
- Validation and error handling
- Offline sync functionality
- Batch operations
- Geolocation integration
- Performance under load

**Database Operations** (`tests/integration/database/interventions.test.ts`)
- CRUD operations for submissions
- Transaction handling
- Cascade deletions
- Query performance with indexes
- Bulk inserts
- Data integrity constraints

### 3. E2E Mobile Tests

**Mobile Workflow** (`tests/e2e/mobile/mobile-workflow.spec.ts`)
- Complete intervention submission flow
- Offline creation and sync
- Touch interactions and gestures
  - Pull-to-refresh
  - Swipe-to-delete
- Photo capture with compression
- Responsive layout and orientation changes
- Form validation with feedback
- Geolocation integration
- Accessibility with screen readers
- Network error handling
- Performance metrics

### 4. PWA Tests

**Offline Mode** (`tests/pwa/offline-mode.test.ts`)
- Service worker registration
- Cache-first strategy for static assets
- Network-first strategy for API calls
- Offline form submission queue
- IndexedDB storage
- Background sync
- Cache management and cleanup

**Installation** (`tests/pwa/installation.test.ts`)
- Web app manifest validation
- Required icon sizes
- Theme color configuration
- Install prompt handling
- Display modes (standalone, fullscreen)
- App shortcuts
- Share target integration
- Push notifications
- Update flow

## Coverage Requirements

| Metric      | Target |
|-------------|--------|
| Statements  | >80%   |
| Branches    | >75%   |
| Functions   | >80%   |
| Lines       | >80%   |

## Testing Tools

### Jest
- Unit and integration testing framework
- Configuration: `jest.config.js`
- Setup: `tests/config/jest.setup.ts`

### React Testing Library
- Component testing with user-centric queries
- Event simulation
- Accessibility testing

### Playwright
- E2E testing with real browser automation
- Mobile device emulation
- Network condition simulation
- Geolocation mocking

### Coverage Tools
- NYC for coverage reporting
- Configuration: `.nycrc.json`

## Best Practices

### 1. Test Organization
- One test file per source file
- Group related tests with `describe` blocks
- Clear, descriptive test names following "should..." pattern

### 2. Test Independence
- Each test should be completely independent
- Use `beforeEach` for setup, `afterEach` for cleanup
- Avoid shared state between tests

### 3. Mock Strategy
- Mock external dependencies (APIs, databases)
- Use real implementations for internal code
- Keep mocks simple and focused

### 4. Assertions
- One assertion per test when possible
- Use specific matchers (`toHaveLength`, `toContain`)
- Avoid generic assertions (`toBeTruthy`)

### 5. Async Testing
- Always use `async/await` for async operations
- Use `waitFor` for dynamic content
- Set appropriate timeouts

## Performance Testing

### Load Tests
- Concurrent intervention creation (10+ simultaneous)
- Batch sync operations (50+ items)
- Photo compression under 1 second
- API response time < 200ms

### Mobile Performance
- Page load time < 3 seconds
- Time to interactive < 2 seconds
- First paint < 1.5 seconds

## PWA Testing Checklist

- [ ] Service worker registers successfully
- [ ] Offline page loading works
- [ ] Static assets cached properly
- [ ] API calls work offline (from cache)
- [ ] Form submissions queue when offline
- [ ] Background sync triggers on reconnection
- [ ] Manifest has all required fields
- [ ] Icons in all required sizes
- [ ] Install prompt appears
- [ ] App works in standalone mode
- [ ] Push notifications register
- [ ] App updates notify user

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hook (via Husky)

## Troubleshooting

### Common Issues

**1. Service Worker Not Registering**
```bash
# Clear service worker cache
npx playwright test --headed  # Visual debugging
```

**2. Tests Timing Out**
```javascript
jest.setTimeout(15000);  // Increase timeout
```

**3. Mock Not Working**
```javascript
// Ensure mocks are in tests/__mocks__/
// Clear module cache: jest.resetModules()
```

**4. Database Tests Failing**
```bash
# Reset test database
npm run db:reset:test
```

## Writing New Tests

### 1. Unit Test Template
```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 2. Component Test Template
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component Name', () => {
  it('should render correctly', () => {
    render(<Component />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### 3. E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test('user flow description', async ({ page }) => {
  await page.goto('/');

  await page.click('[data-testid="button"]');

  await expect(page.locator('h1')).toContainText('Success');
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [PWA Testing Guide](https://web.dev/pwa/)

## Contributing

1. Write tests for all new features
2. Update existing tests when modifying code
3. Ensure coverage thresholds are met
4. Run full test suite before submitting PR

## Support

For testing issues or questions:
- Check existing tests for examples
- Review this documentation
- Ask in team chat
- Create an issue if you find bugs in tests
