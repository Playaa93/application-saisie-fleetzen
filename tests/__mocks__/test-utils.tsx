/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data generators
export const generateForm = (overrides = {}) => ({
  id: `form-${Date.now()}`,
  title: 'Test Form',
  description: 'Test form description',
  fields: [],
  settings: {
    submitButtonText: 'Submit',
    successMessage: 'Thank you!',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'draft',
  ...overrides,
});

export const generateField = (overrides = {}) => ({
  id: `field-${Date.now()}`,
  type: 'text',
  label: 'Test Field',
  placeholder: '',
  required: false,
  validation: {},
  ...overrides,
});

export const generateSubmission = (formId: string, overrides = {}) => ({
  id: `sub-${Date.now()}`,
  formId,
  responses: {},
  submittedAt: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const mockApiSuccess = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

export const mockApiError = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
});

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Form validation helpers
export const createValidationError = (field: string, message: string) => ({
  field,
  message,
  type: 'validation',
});

// Mock fetch
export const setupMockFetch = () => {
  global.fetch = jest.fn();
  return global.fetch as jest.Mock;
};

// Cleanup mock fetch
export const cleanupMockFetch = () => {
  if (global.fetch && typeof (global.fetch as any).mockRestore === 'function') {
    (global.fetch as any).mockRestore();
  }
};

// Mock localStorage
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Simulate user input delay
export const simulateTypingDelay = (ms: number = 100) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Create mock file
export const createMockFile = (
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
) => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// Assert element has classes
export const expectToHaveClasses = (
  element: HTMLElement,
  classes: string[]
) => {
  classes.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

// Wait for element to be removed
export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
  timeout: number = 1000
) => {
  const startTime = Date.now();

  while (callback() !== null) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Element was not removed within timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};
