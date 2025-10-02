/**
 * @test E2E Form Management Flow
 * @description End-to-end tests for form listing, searching, and management
 */

import { test, expect } from '@playwright/test';

test.describe('Form Management Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create some test forms
    await page.goto('/');

    const forms = ['Contact Form', 'Survey Form', 'Registration Form'];

    for (const formName of forms) {
      await page.click('text=Create New Form');
      await page.fill('input[name="formTitle"]', formName);
      await page.click('button:has-text("Save Form")');
      await page.waitForURL(/\/forms/);
    }
  });

  test('should display all forms in list', async ({ page }) => {
    await page.goto('/forms');

    await expect(page.locator('text=Contact Form')).toBeVisible();
    await expect(page.locator('text=Survey Form')).toBeVisible();
    await expect(page.locator('text=Registration Form')).toBeVisible();
  });

  test('should search forms by title', async ({ page }) => {
    await page.goto('/forms');

    await page.fill('input[placeholder="Search forms..."]', 'Contact');

    await expect(page.locator('text=Contact Form')).toBeVisible();
    await expect(page.locator('text=Survey Form')).not.toBeVisible();
    await expect(page.locator('text=Registration Form')).not.toBeVisible();
  });

  test('should filter forms by status', async ({ page }) => {
    await page.goto('/forms');

    await page.selectOption('select[name="status"]', 'published');

    // Verify filtered results
    const formList = page.locator('[data-testid="form-list"]');
    await expect(formList).toBeVisible();
  });

  test('should sort forms by creation date', async ({ page }) => {
    await page.goto('/forms');

    await page.click('button:has-text("Sort by Date")');

    const firstForm = page.locator('[data-testid="form-item"]').first();
    await expect(firstForm).toContainText('Registration Form'); // Most recent
  });

  test('should paginate form list', async ({ page }) => {
    await page.goto('/forms');

    // Verify pagination controls
    await expect(page.locator('button:has-text("Next")')).toBeVisible();

    // Navigate to next page
    await page.click('button:has-text("Next")');

    // Verify URL or page indicator changed
    await expect(page).toHaveURL(/page=2/);
  });

  test('should delete form with confirmation', async ({ page }) => {
    await page.goto('/forms');

    // Click delete on first form
    await page.locator('button[aria-label="Delete form"]').first().click();

    // Verify confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this form?')).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify success message
    await expect(page.locator('text=Form deleted successfully')).toBeVisible();

    // Verify form is removed from list
    await expect(page.locator('text=Contact Form')).not.toBeVisible();
  });

  test('should duplicate form', async ({ page }) => {
    await page.goto('/forms');

    // Click duplicate on first form
    await page.locator('button[aria-label="Duplicate form"]').first().click();

    // Verify duplicate created
    await expect(page.locator('text=Contact Form (Copy)')).toBeVisible();
  });

  test('should export form as JSON', async ({ page }) => {
    await page.goto('/forms');

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');

    await page.locator('button[aria-label="Export form"]').first().click();

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/contact-form.*\.json/);
  });

  test('should import form from JSON', async ({ page }) => {
    await page.goto('/forms');

    await page.click('button:has-text("Import Form")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'form.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        title: 'Imported Form',
        fields: [
          { id: '1', type: 'text', label: 'Name' },
        ],
      })),
    });

    // Submit import
    await page.click('button:has-text("Import")');

    // Verify imported form appears
    await expect(page.locator('text=Imported Form')).toBeVisible();
  });
});

test.describe('Form Analytics', () => {
  test('should display submission count', async ({ page }) => {
    await page.goto('/forms');

    // View form details
    await page.click('text=Contact Form');

    // Verify analytics section
    await expect(page.locator('[data-testid="submission-count"]')).toBeVisible();
    await expect(page.locator('text=0 submissions')).toBeVisible();
  });

  test('should show submission history', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');

    // Navigate to submissions tab
    await page.click('text=Submissions');

    // Verify submissions list
    await expect(page.locator('[data-testid="submissions-list"]')).toBeVisible();
  });

  test('should view individual submission', async ({ page }) => {
    // First submit a form
    await page.goto('/forms');
    await page.click('text=View Form');

    await page.fill('input[name="Name"]', 'Test User');
    await page.fill('input[name="Email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Go to submissions
    await page.goto('/forms');
    await page.click('text=Contact Form');
    await page.click('text=Submissions');

    // Click on submission
    await page.locator('[data-testid="submission-item"]').first().click();

    // Verify submission details
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('should export submissions as CSV', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');
    await page.click('text=Submissions');

    const downloadPromise = page.waitForEvent('download');

    await page.click('button:has-text("Export CSV")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

test.describe('Form Sharing', () => {
  test('should generate shareable link', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');

    await page.click('button:has-text("Share")');

    // Verify shareable link displayed
    await expect(page.locator('input[readonly][value*="http"]')).toBeVisible();
  });

  test('should copy link to clipboard', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');

    await page.click('button:has-text("Share")');
    await page.click('button:has-text("Copy Link")');

    // Verify copy success message
    await expect(page.locator('text=Link copied')).toBeVisible();
  });

  test('should toggle form public/private', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');

    // Toggle to private
    await page.click('button:has-text("Make Private")');

    await expect(page.locator('text=Form is now private')).toBeVisible();

    // Toggle back to public
    await page.click('button:has-text("Make Public")');

    await expect(page.locator('text=Form is now public')).toBeVisible();
  });

  test('should embed form code', async ({ page }) => {
    await page.goto('/forms');
    await page.click('text=Contact Form');

    await page.click('button:has-text("Embed")');

    // Verify embed code displayed
    const embedCode = page.locator('textarea[readonly]');
    await expect(embedCode).toBeVisible();
    await expect(embedCode).toContainText('<iframe');
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate forms with keyboard', async ({ page }) => {
    await page.goto('/forms');

    // Tab to first form
    await page.keyboard.press('Tab');

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Verify form opened
    await expect(page).toHaveURL(/\/forms\/.+/);
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    await page.goto('/forms');

    // Press Ctrl+N to create new form
    await page.keyboard.press('Control+n');

    // Verify form builder opened
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/forms');

    // Simulate network error
    await page.route('**/api/forms', route => route.abort());

    await page.reload();

    // Verify error message
    await expect(page.locator('text=Failed to load forms')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should retry failed operations', async ({ page }) => {
    await page.goto('/forms');

    // Simulate temporary error
    let requestCount = 0;
    await page.route('**/api/forms', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.reload();

    // Click retry
    await page.click('button:has-text("Retry")');

    // Verify forms loaded
    await expect(page.locator('[data-testid="form-list"]')).toBeVisible();
  });

  test('should show appropriate error for 404', async ({ page }) => {
    await page.goto('/forms/non-existent-id');

    await expect(page.locator('text=Form not found')).toBeVisible();
    await expect(page.locator('button:has-text("Back to Forms")')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load large form lists efficiently', async ({ page }) => {
    await page.goto('/forms');

    // Measure load time
    const startTime = Date.now();

    await expect(page.locator('[data-testid="form-list"]')).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle rapid clicking', async ({ page }) => {
    await page.goto('/forms');

    // Rapidly click create button
    for (let i = 0; i < 5; i++) {
      await page.click('text=Create New Form', { timeout: 100 }).catch(() => {});
    }

    // Should only open one form builder
    const builders = page.locator('[data-testid="form-builder"]');
    await expect(builders).toHaveCount(1);
  });
});
