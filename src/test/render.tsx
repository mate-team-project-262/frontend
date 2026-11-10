import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createQueryClient } from '../api/queryClient.ts';

/** Every test gets its own empty TanStack Query cache. */
function createWrapper() {
  const client = createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/** `render` for components that load data with TanStack Query. */
export const renderWithQuery = (ui: ReactElement) => render(ui, { wrapper: createWrapper() });

/** `renderHook` for hooks that load data with TanStack Query. */
export const renderHookWithQuery = <T,>(hook: () => T) =>
  renderHook(hook, { wrapper: createWrapper() });
