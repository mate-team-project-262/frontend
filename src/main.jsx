import '@fontsource-variable/inter';
import '@fontsource/geologica/400.css';
import '@fontsource/geologica/700.css';
import '@fontsource/geologica/900.css';
import './styles/base.css'; // first, so component styles can override it
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';

createRoot(document.querySelector('#root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
