import {
  apiRequest,
  checkBackendHealth,
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  setUnauthorizedHandler,
  storeSessionTokens,
} from './api.js';
import { state } from './state.js';
import { applyNavigationPermissions, displayMessage, setActiveSection, toggleScreens, updateUserHeader } from './ui.js';
import { setupFormValidation, validateForm } from './validation.js';

export function initAuth(onAuthenticated) {
  const loginForm = document.getElementById('login-form');
  setupFormValidation(loginForm);
  loginForm.addEventListener('submit', (e) => handleLogin(e, onAuthenticated));
  document.getElementById('logout-btn').addEventListener('click', () => logout());
  setUnauthorizedHandler(() => logout(true));
  pingBackend();
  checkSession(onAuthenticated);
}

async function pingBackend() {
  const banner = document.getElementById('login-message');
  try {
    await checkBackendHealth();
    banner.style.display = 'none';
  } catch (error) {
    displayMessage(
      'login-message',
      'error',
      `${error.message} Se stai usando Supabase, conferma che l'API sia raggiungibile e che il file SUPABASE_SETUP.md sia stato seguito.`,
      { persist: true },
    );
  }
}

async function handleLogin(event, onAuthenticated) {
  event.preventDefault();
  if (!validateForm(event.target)) {
    return;
  }
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const submitBtn = event.target.querySelector('.submit-btn');

  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Accesso in corso...';
  document.getElementById('login-message').style.display = 'none';

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    persistSession(data);
    onAuthenticated();
  } catch (error) {
    console.error('Errore login:', error);
    displayMessage(
      'login-message',
      'error',
      `${error.message || 'Credenziali non valide'}\n\nSuggerimenti rapidi: verifica che il server Node sia avviato con "npm start" e che il file .env contenga SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY corretti.`,
      { persist: true },
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🔐 Accedi';
  }
}

function persistSession({ access_token, refresh_token, user, profile }) {
  storeSessionTokens({ access_token, refresh_token });
  state.currentUser = {
    id: user.id,
    email: user.email,
    name: profile.name,
    role: profile.role,
    company_id: profile.company_id,
    company_name: profile.company_name,
  };
}

async function checkSession(onAuthenticated) {
  const existingToken = getAccessToken();
  if (!existingToken) return;

  try {
    const session = await apiRequest('/auth/session');
    persistSession({
      access_token: existingToken,
      refresh_token: getRefreshToken(),
      user: session.user,
      profile: session.profile,
    });
    onAuthenticated();
  } catch (error) {
    console.warn('Sessione non valida:', error);
    await logout(true);
  }
}

export async function logout(silent = false) {
  const refresh_token = getRefreshToken();
  clearSessionTokens();
  state.currentUser = null;

  if (refresh_token) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
      });
    } catch (error) {
      console.warn('Errore durante il logout:', error);
    }
  }

  toggleScreens(false);
  if (!silent) {
    displayMessage('login-message', 'success', 'Logout effettuato con successo');
  }
}

export function showApp() {
  toggleScreens(true);
  if (!state.currentUser) return;

  updateUserHeader(state.currentUser);
  const firstVisibleBtn = applyNavigationPermissions(state.currentUser.role);
  if (firstVisibleBtn) {
    setActiveSection(firstVisibleBtn.dataset.target);
  }
}
