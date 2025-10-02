/**
 * @test E2E Form Creation Flow
 * @description End-to-end tests for form creation workflow
 * @prerequisites
 *   - Application is running on localhost:3000
 *   - Database is empty or in known state
 */

import { test, expect } from '@playwright/test';

test.describe('Form Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a new form successfully', async ({ page }) => {
    // Navigate to form builder
    await page.click('text=Create New Form');

    // Wait for form builder to load
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();

    // Set form title
    await page.fill('input[name="formTitle"]', 'Contact Form');

    // Add text field
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Full Name');
    await page.check('input[type="checkbox"][name="required"]');

    // Add email field
    await page.click('button:has-text("Add Email Field")');
    await page.fill('input[placeholder="Field Label"]', 'Email Address');
    await page.check('input[type="checkbox"][name="required"]');

    // Add select field
    await page.click('button:has-text("Add Select Field")');
    await page.fill('input[placeholder="Field Label"]', 'Country');
    await page.fill('input[placeholder="Option 1"]', 'United States');
    await page.click('button:has-text("Add Option")');
    await page.fill('input[placeholder="Option 2"]', 'United Kingdom');

    // Save form
    await page.click('button:has-text("Save Form")');

    // Verify success message
    await expect(page.locator('text=Form saved successfully')).toBeVisible();

    // Verify redirect to form list
    await expect(page).toHaveURL(/\/forms/);
    await expect(page.locator('text=Contact Form')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('text=Create New Form');

    // Try to save without title
    await page.click('button:has-text("Save Form")');

    // Verify error message
    await expect(page.locator('text=Form title is required')).toBeVisible();

    // Add title
    await page.fill('input[name="formTitle"]', 'Test Form');

    // Save again
    await page.click('button:has-text("Save Form")');

    // Should succeed now
    await expect(page.locator('text=Form saved successfully')).toBeVisible();
  });

  test('should support drag and drop field reordering', async ({ page }) => {
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Test Form');

    // Add two fields
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'First Field');

    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Second Field');

    // Get field positions before drag
    const firstField = page.locator('text=First Field').first();
    const secondField = page.locator('text=Second Field').first();

    // Drag second field to first position
    await secondField.dragTo(firstField);

    // Verify order changed
    const fields = page.locator('[data-testid="field-item"]');
    await expect(fields.first()).toContainText('Second Field');
  });

  test('should delete fields', async ({ page }) => {
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Test Form');

    // Add a field
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Test Field');

    // Delete the field
    await page.click('button[aria-label="Delete field"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify field is removed
    await expect(page.locator('text=Test Field')).not.toBeVisible();
  });

  test('should preview form before saving', async ({ page }) => {
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Preview Test');

    // Add fields
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Name');

    // Click preview
    await page.click('button:has-text("Preview")');

    // Verify preview mode
    await expect(page.locator('[data-testid="form-preview"]')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();

    // Close preview
    await page.click('button:has-text("Close Preview")');

    // Verify back to edit mode
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
  });

  test('should handle field validation rules', async ({ page }) => {
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Validation Test');

    // Add text field with validation
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Username');

    // Set min length
    await page.fill('input[name="minLength"]', '3');

    // Set max length
    await page.fill('input[name="maxLength"]', '20');

    // Set pattern
    await page.fill('input[name="pattern"]', '^[a-zA-Z0-9]+$');

    // Save form
    await page.click('button:has-text("Save Form")');

    await expect(page.locator('text=Form saved successfully')).toBeVisible();
  });
});

test.describe('Form Editing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test form first
    await page.goto('/');
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Test Form');
    await page.click('button:has-text("Save Form")');
    await page.waitForURL(/\/forms/);
  });

  test('should edit existing form', async ({ page }) => {
    // Click edit button
    await page.click('button[aria-label="Edit form"]');

    // Modify title
    await page.fill('input[name="formTitle"]', 'Updated Form Title');

    // Add new field
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'New Field');

    // Save changes
    await page.click('button:has-text("Save Form")');

    // Verify update
    await expect(page.locator('text=Form updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Form Title')).toBeVisible();
  });

  test('should discard changes on cancel', async ({ page }) => {
    await page.click('button[aria-label="Edit form"]');

    // Make changes
    await page.fill('input[name="formTitle"]', 'Changed Title');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Confirm discard
    await page.click('button:has-text("Discard Changes")');

    // Verify original title
    await expect(page.locator('text=Test Form')).toBeVisible();
    await expect(page.locator('text=Changed Title')).not.toBeVisible();
  });
});

test.describe('Form Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Create and publish a test form
    await page.goto('/');
    await page.click('text=Create New Form');
    await page.fill('input[name="formTitle"]', 'Contact Form');

    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Name');
    await page.check('input[type="checkbox"][name="required"]');

    await page.click('button:has-text("Add Email Field")');
    await page.fill('input[placeholder="Field Label"]', 'Email');
    await page.check('input[type="checkbox"][name="required"]');

    await page.click('button:has-text("Save Form")');
    await page.waitForURL(/\/forms/);
  });

  test('should submit form with valid data', async ({ page }) => {
    // Navigate to public form
    await page.click('text=View Form');

    // Fill form
    await page.fill('input[name="Name"]', 'John Doe');
    await page.fill('input[name="Email"]', 'john@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Form submitted successfully')).toBeVisible();
  });

  test('should validate required fields on submit', async ({ page }) => {
    await page.click('text=View Form');

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=This field is required')).toHaveCount(2);
  });

  test('should validate email format', async ({ page }) => {
    await page.click('text=View Form');

    await page.fill('input[name="Name"]', 'John Doe');
    await page.fill('input[name="Email"]', 'invalid-email');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should clear form after successful submission', async ({ page }) => {
    await page.click('text=View Form');

    await page.fill('input[name="Name"]', 'John Doe');
    await page.fill('input[name="Email"]', 'john@example.com');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Form submitted successfully')).toBeVisible();

    // Verify form is cleared
    const nameInput = page.locator('input[name="Name"]') as any;
    const emailInput = page.locator('input[name="Email"]') as any;

    await expect(nameInput).toHaveValue('');
    await expect(emailInput).toHaveValue('');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.click('text=Create New Form');

    // Verify mobile layout
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();

    // Add field on mobile
    await page.click('button:has-text("Add Text Field")');
    await page.fill('input[placeholder="Field Label"]', 'Mobile Field');

    // Verify field added
    await expect(page.locator('text=Mobile Field')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.click('text=Create New Form');

    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
  });
});
