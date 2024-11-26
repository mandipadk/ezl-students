import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { setupServer } from 'msw/node';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }) => <div>{children}</div>,
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

// Setup MSW
const server = setupServer();

beforeAll(() => {
  // Polyfill TextEncoder/TextDecoder
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  
  // Start MSW server
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => server.close()); 