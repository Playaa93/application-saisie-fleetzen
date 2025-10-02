/**
 * E2E Mobile Tests - Field Agent Workflow
 * Tests complete mobile user journey with touch interactions
 * @requires Playwright with mobile viewport emulation
 */

import { test, expect, devices } from '@playwright/test';

// Configure mobile viewport
test.use({
  ...devices['iPhone 12 Pro'],
  // Enable geolocation
  geolocation: { latitude: 40.7128, longitude: -74.0060 },
  permissions: ['geolocation'],
});

test.describe('Mobile Field Agent Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
  });

  test('complete intervention submission flow', async ({ page, context }) => {
    // Step 1: Login as field agent
    await page.click('[data-testid="login-button"]');
    await page.fill('[name="email"]', 'agent@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.tap('[type="submit"]');

    await page.waitForURL('/dashboard');
    expect(await page.textContent('h1')).toContain('Dashboard');

    // Step 2: Start new intervention
    await page.tap('[data-testid="new-intervention"]');
    await page.waitForSelector('[data-testid="intervention-form"]');

    // Step 3: Fill location (should auto-populate from GPS)
    const locationField = page.locator('[name="location"]');
    await expect(locationField).not.toBeEmpty();

    // Can override auto-location
    await locationField.fill('Building A, Floor 3, Room 301');

    // Step 4: Add description
    await page.fill('[name="description"]', 'Water leak detected in ceiling panel');

    // Step 5: Select priority
    await page.tap('[data-testid="priority-select"]');
    await page.tap('[data-value="high"]');

    // Step 6: Take/upload photo
    await page.tap('[data-testid="photo-button"]');

    // Simulate camera capture
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'intervention-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Wait for photo to upload/compress
    await page.waitForSelector('[data-testid="photo-preview"]', {
      state: 'visible',
      timeout: 5000,
    });

    // Step 7: Submit intervention
    await page.tap('[data-testid="submit-intervention"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Intervention submitted successfully');

    // Should redirect to interventions list
    await page.waitForURL('/interventions');

    // Verify intervention appears in list
    await expect(page.locator('[data-testid="intervention-item"]').first())
      .toContainText('Building A, Floor 3, Room 301');
  });

  test('offline intervention creation and sync', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'agent@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.tap('[type="submit"]');
    await page.waitForURL('/dashboard');

    // Simulate going offline
    await context.setOffline(true);

    // Create intervention while offline
    await page.tap('[data-testid="new-intervention"]');
    await page.fill('[name="location"]', 'Offline Location');
    await page.fill('[name="description"]', 'Created while offline');
    await page.tap('[data-testid="priority-select"]');
    await page.tap('[data-value="medium"]');

    await page.tap('[data-testid="submit-intervention"]');

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Should save to local storage
    await expect(page.locator('[data-testid="pending-sync-badge"]')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Trigger sync
    await page.tap('[data-testid="sync-button"]');

    // Wait for sync to complete
    await page.waitForSelector('[data-testid="sync-success"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Verify offline intervention was synced
    await page.goto('/interventions');
    await expect(page.locator('[data-testid="intervention-item"]'))
      .toContainText('Offline Location');
  });

  test('touch interactions and gestures', async ({ page }) => {
    await page.goto('/interventions');

    // Test pull-to-refresh gesture
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    const interventionsList = page.locator('[data-testid="interventions-list"]');
    const box = await interventionsList.boundingBox();

    if (box) {
      // Simulate pull-down gesture
      await page.mouse.move(box.x + box.width / 2, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 150, { steps: 10 });
      await page.mouse.up();
    }

    // Should show loading indicator
    await expect(page.locator('[data-testid="refreshing-indicator"]')).toBeVisible();

    // Test swipe to delete
    const firstItem = page.locator('[data-testid="intervention-item"]').first();
    const itemBox = await firstItem.boundingBox();

    if (itemBox) {
      // Swipe left
      await page.mouse.move(itemBox.x + itemBox.width - 10, itemBox.y + itemBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(itemBox.x + 50, itemBox.y + itemBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Should reveal delete button
    await expect(page.locator('[data-testid="delete-button"]')).toBeVisible();
  });

  test('photo capture with compression', async ({ page }) => {
    await page.goto('/interventions/new');

    // Open camera/photo picker
    await page.tap('[data-testid="photo-button"]');

    // Upload large photo
    const largePhotoBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
    await page.locator('input[type="file"]').setInputFiles({
      name: 'large-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: largePhotoBuffer,
    });

    // Should show compression progress
    await expect(page.locator('[data-testid="compression-progress"]'))
      .toBeVisible({ timeout: 2000 });

    // Wait for compression to complete
    await page.waitForSelector('[data-testid="photo-preview"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Verify compression indicator
    await expect(page.locator('[data-testid="compressed-badge"]')).toBeVisible();

    // Check compressed size is displayed
    const sizeText = await page.textContent('[data-testid="photo-size"]');
    expect(sizeText).toMatch(/KB|MB/);
  });

  test('responsive layout and orientation changes', async ({ page }) => {
    await page.goto('/dashboard');

    // Portrait mode (default)
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

    // Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });

    // Layout should adapt
    await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible();

    // Rotate back to portrait
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('form validation with haptic feedback', async ({ page }) => {
    await page.goto('/interventions/new');

    // Try to submit without required fields
    await page.tap('[data-testid="submit-intervention"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toHaveCount(2); // location and description

    // Fill location only
    await page.fill('[name="location"]', 'Test Location');
    await page.tap('[data-testid="submit-intervention"]');

    // Should still have one error (description)
    await expect(page.locator('[data-testid="validation-error"]')).toHaveCount(1);

    // Complete the form
    await page.fill('[name="description"]', 'Test description');
    await page.tap('[data-testid="submit-intervention"]');

    // Errors should be cleared
    await expect(page.locator('[data-testid="validation-error"]')).toHaveCount(0);
  });

  test('geolocation integration', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);

    await page.goto('/interventions/new');

    // Should auto-detect location
    await page.waitForSelector('[data-testid="location-detected"]', {
      state: 'visible',
      timeout: 5000,
    });

    // Coordinates should be populated
    const coordinates = await page.textContent('[data-testid="coordinates"]');
    expect(coordinates).toMatch(/40\.7128.*-74\.0060/);

    // User can refine location
    await page.fill('[name="location"]', 'Building B, Room 202');

    // Coordinates should persist
    const updatedCoordinates = await page.textContent('[data-testid="coordinates"]');
    expect(updatedCoordinates).toMatch(/40\.7128.*-74\.0060/);
  });

  test('accessibility with screen reader', async ({ page }) => {
    await page.goto('/interventions/new');

    // Check ARIA labels
    await expect(page.locator('[name="location"]'))
      .toHaveAttribute('aria-label', 'Intervention location');

    await expect(page.locator('[name="description"]'))
      .toHaveAttribute('aria-label', 'Intervention description');

    // Check form landmarks
    const form = page.locator('form[role="form"]');
    await expect(form).toBeVisible();

    // Test keyboard navigation (tab order)
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="location"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="description"]')).toBeFocused();
  });

  test('network error handling', async ({ page, context }) => {
    await page.goto('/interventions/new');

    // Fill form
    await page.fill('[name="location"]', 'Network Test Location');
    await page.fill('[name="description"]', 'Testing network failure');

    // Simulate network failure mid-submission
    await context.setOffline(true);
    await page.tap('[data-testid="submit-intervention"]');

    // Should show error and offer to save offline
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-offline-button"]')).toBeVisible();

    // Save offline
    await page.tap('[data-testid="save-offline-button"]');

    // Should confirm offline save
    await expect(page.locator('[data-testid="saved-offline-message"]')).toBeVisible();
  });

  test('performance metrics on mobile', async ({ page }) => {
    // Navigate and measure performance
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: perfData.loadEventEnd - perfData.fetchStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime,
      };
    });

    // Mobile load time should be under 3 seconds
    expect(metrics.loadTime).toBeLessThan(3000);
    expect(metrics.domContentLoaded).toBeLessThan(2000);

    // First paint should be under 1.5 seconds
    expect(metrics.firstPaint).toBeLessThan(1500);
  });
});
