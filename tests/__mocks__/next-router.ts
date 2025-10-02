/**
 * Mock Next.js Router for testing
 */

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

export const useRouter = jest.fn(() => mockRouter);

export const usePathname = jest.fn(() => '/');

export const useSearchParams = jest.fn(() => new URLSearchParams());

export default mockRouter;
