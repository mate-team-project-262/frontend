import '@fontsource-variable/inter';
import '@fontsource/geologica/400.css';
import '@fontsource/geologica/700.css';
import '@fontsource/geologica/900.css';
import './styles/base.css'; // first, so component styles can override it
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { createQueryClient } from './api/queryClient.ts';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.tsx';

const queryClient = createQueryClient();

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
