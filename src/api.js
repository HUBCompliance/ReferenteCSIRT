const API_BASE = '/api';
const ACCESS_TOKEN_KEY = 'referente_csirt_access_token';
const REFRESH_TOKEN_KEY = 'referente_csirt_refresh_token';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeSessionTokens({ access_token, refresh_token }) {
  if (access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
}

export function clearSessionTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (unauthorizedHandler) {
      await unauthorizedHandler();
    }
    throw new Error('Sessione scaduta, effettua di nuovo il login');
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Errore di rete');
  }

  return payload;
}
