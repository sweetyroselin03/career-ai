export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData (e.g., file upload), delete Content-Type so the browser sets the boundary correctly
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("[API] Received 401 Unauthorized from backend. Clearing invalid token.");
    // Do not clear token immediately on startup checks unless it's a real expired event,
    // but log it to console to assist manual testing.
  }

  return response;
};
