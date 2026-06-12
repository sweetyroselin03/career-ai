import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Fetch Interceptor to automatically attach JWT authorization headers
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return originalFetch(input, init);
  }

  if (input instanceof Request) {
    const newRequest = input.clone();
    if (!newRequest.headers.has('Authorization')) {
      newRequest.headers.set('Authorization', `Bearer ${token}`);
    }
    return originalFetch(newRequest, init);
  } else {
    const newInit = { ...init };
    const headers = new Headers(newInit.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    newInit.headers = headers;
    return originalFetch(input, newInit);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
