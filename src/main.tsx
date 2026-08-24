import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { rememberPostLoginPath } from './lib/idp';
import { normalizePath } from './lib/navigate';
import './styles.css';

const initialPath = normalizePath();
if (
  initialPath !== '/login' &&
  initialPath !== '/auth/callback' &&
  !localStorage.getItem('blockyedu_token')
) {
  rememberPostLoginPath(initialPath);
  window.history.replaceState({}, '', '/login');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
