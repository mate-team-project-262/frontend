import '@fontsource-variable/inter';
import './styles/base.css'; // first, so component styles can override it
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.querySelector('#root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
