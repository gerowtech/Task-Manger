const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${clean}`;
}

export async function readJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; }
  catch {
    if (response.status >= 500) {
      throw new Error(`REST API returned HTTP ${response.status}. Make sure the Node.js server is running on http://localhost:5000 and MongoDB is running.`);
    }
    throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
  }
}

export const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : ''}`,
  'Content-Type': 'application/json',
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const response = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await readJson<{accessToken?: string}>(response);
    if (!response.ok || !data.accessToken) return null;
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  } catch { return null; }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('/api/') ? apiUrl(input.slice(4)) : input;
  const headers = new Headers(init.headers || {});
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (error) {
    throw new Error('Unable to connect to the REST API. Start MongoDB and the Node.js server with npm run dev.');
  }

  if (response.status === 401 && typeof window !== 'undefined' && !String(url).includes('/auth/')) {
    if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = null; });
    const newToken = await refreshing;
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (!retryHeaders.has('Content-Type') && init.body) retryHeaders.set('Content-Type', 'application/json');
      response = await fetch(url, { ...init, headers: retryHeaders });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
  return response;
}
