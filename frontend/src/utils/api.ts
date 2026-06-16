/**
 * Centralized API fetch utility with:
 * - Automatic JWT Bearer token injection
 * - Automatic retry on network/503 errors (1 retry)
 * - Clean error messages (never "Failed to fetch")
 * - FormData support for file uploads
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {},
  _retryCount = 0
): Promise<Response> => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, delete Content-Type so the browser sets the boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // On 503 (DB connection error), retry once automatically
    if (response.status === 503 && _retryCount < 1) {
      console.warn(`[API] 503 from ${url}, retrying in 1s...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(url, options, _retryCount + 1);
    }

    if (response.status === 401) {
      console.warn(`[API] 401 Unauthorized: ${options.method || 'GET'} ${url}`);
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    } else if (!response.ok) {
      console.error(`[API] ${response.status} ${response.statusText}: ${options.method || 'GET'} ${url}`);
    }

    return response;
  } catch (error: any) {
    // Network-level errors (backend down, CORS block, DNS failure)
    if (_retryCount < 1) {
      console.warn(`[API] Network error for ${url}, retrying in 1s...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch(url, options, _retryCount + 1);
    }

    console.error(`[API] Connection failed for ${options.method || 'GET'} ${url}:`, error.message);
    
    // Return a synthetic Response so callers don't crash with "Failed to fetch"
    return new Response(
      JSON.stringify({ msg: 'Server is temporarily unavailable. Please check your connection and try again.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
