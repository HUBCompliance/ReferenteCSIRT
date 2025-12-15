import { apiRequest } from './api.js';
import { state } from './state.js';
import { displayMessage, populateSelect, renderUsers } from './ui.js';

export function bindUserRoleToggle() {
  const roleSelect = document.getElementById('new_user_role');
  roleSelect.addEventListener('change', function onChange() {
    const companyField = document.getElementById('user-company-field');
    companyField.style.display = this.value === 'company' ? 'block' : 'none';
  });
}

export async function loadCompaniesForUserForm() {
  try {
    const data = await apiRequest('/companies');
    const select = document.getElementById('new_user_company');
    populateSelect(select, data || [], 'Nessuna (per Admin/CSIRT)');
  } catch (error) {
    console.error('Errore:', error);
  }
}

export function bindUserForm() {
  const userForm = document.getElementById('utenti-form');
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (state.currentUser?.role !== 'admin') {
      displayMessage('utenti-message', 'error', 'Solo gli Admin possono creare utenti');
      return;
    }

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Creazione...';

    try {
      const payload = {
        email: document.getElementById('new_user_email').value,
        password: document.getElementById('new_user_password').value,
        name: document.getElementById('new_user_name').value,
        role: document.getElementById('new_user_role').value,
        company_id: document.getElementById('new_user_company').value || null,
      };

      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      displayMessage('utenti-message', 'success', '✅ Utente creato con successo!');
      e.target.reset();
      loadUsers();
    } catch (error) {
      console.error('Errore:', error);
      displayMessage('utenti-message', 'error', '❌ Errore creazione: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '👤 Crea Utente';
    }
  });
}

export async function loadUsers() {
  const container = document.getElementById('users-list');
  container.innerHTML = '<div class="loading">⏳ Caricamento...</div>';

  try {
    const profiles = await apiRequest('/users');
    renderUsers('users-list', profiles);
  } catch (error) {
    console.error('Errore:', error);
    container.innerHTML = `<div class="message error">❌ Errore: ${error.message}</div>`;
  }
}
