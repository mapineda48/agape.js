import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

// Ensure React is globally available if needed by some components that don't import it
global.React = React;

afterEach(() => {
  cleanup();
});

// Better randomUUID mock to avoid duplicate keys in PortalProvider
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${uuidCounter++}`,
  },
});

// Mock ResizeObserver for components that might use it (like framer-motion or some UI libs)
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock window.matchMedia if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
// Mock framer-motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, ...props }: any, ref) =>
        React.createElement('div', { ...props, ref }, children)
      ),
      button: React.forwardRef(({ children, ...props }: any, ref) =>
        React.createElement('button', { ...props, ref }, children)
      ),
      span: React.forwardRef(({ children, ...props }: any, ref) =>
        React.createElement('span', { ...props, ref }, children)
      ),
      h2: React.forwardRef(({ children, ...props }: any, ref) =>
        React.createElement('h2', { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});
