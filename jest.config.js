/**
 * Jest Configuration
 * Unit and Integration Testing Setup
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/config/jest.setup.ts'],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/', // E2E tests run with Playwright
    '/.next/',
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/db/seed.ts',
  ],

  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },

  coverageDirectory: '<rootDir>/coverage',

  // Timeouts
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};
