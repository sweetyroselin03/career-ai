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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.warn(`[API] Received 401 Unauthorized from: ${options.method || 'GET'} ${url}. Dispatching auth-unauthorized event.`);
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    } else if (!response.ok) {
      console.error(`[API] Fetch failed. Status: ${response.status} (${response.statusText}) for ${options.method || 'GET'} ${url}`);
    }

    return response;
  } catch (error: any) {
    console.error(`[API] Network or connection error for ${options.method || 'GET'} ${url}:`, error.message || error);
    throw error;
  }
};
