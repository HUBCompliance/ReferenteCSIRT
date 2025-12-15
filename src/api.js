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

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.details || `Backend non disponibile (HTTP ${response.status})`);
    }
    return response.json();
  } catch (error) {
    const reason = error?.message ? ` Dettaglio: ${error.message}` : '';
    throw new Error(
      `Backend non raggiungibile. Avvia il server Node (npm start), verifica il proxy /api e le variabili Supabase nel file .env.${reason}`,
    throw new Error(
      'Backend non raggiungibile. Avvia il server Node (npm start) e verifica le variabili Supabase nel file .env.',
      { cause: error },
    );
  }
}

export async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (networkError) {
    throw new Error('Impossibile contattare il server. Controlla la connessione o che il proxy backend sia attivo.');
  }

  const rawBody = await response.text();
  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (_parseError) {
    payload = {};
  }
  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (unauthorizedHandler) {
      await unauthorizedHandler();
    }
    throw new Error('Sessione scaduta, effettua di nuovo il login');
  }

  if (!response.ok) {
    const statusLabel = response.status ? ` (HTTP ${response.status})` : '';
    const fallback =
      response.status === 404
        ? 'Endpoint /api non trovato. Avvia il server backend con "npm start" (non usare solo "npm run dev").'
        : 'Errore di rete';
    const details = payload.error || payload.message || payload.details || rawBody || fallback;
    throw new Error(`${details}${statusLabel}`);
  }

  return payload;
}
