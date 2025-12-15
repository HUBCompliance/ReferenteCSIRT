import { apiRequest } from './api.js';
import { state } from './state.js';
import {
  displayMessage,
  populateSelect,
  renderIncidentsList,
  resetSelect,
  syncCompanyVisibility,
} from './ui.js';

export async function loadCompaniesForSelect() {
  const cfgSelect = document.getElementById('cfg_company_id');
  const incSelect = document.getElementById('inc_company_id');
  const selects = [cfgSelect, incSelect];

  selects.forEach((select) => {
    select.innerHTML = '<option value="">Caricamento...</option>';
    select.disabled = true;
  });

  try {
    const data = await apiRequest('/companies');
    state.currentCompanies = data || [];

    selects.forEach((select) => {
      populateSelect(select, state.currentCompanies, "Seleziona un'azienda...");
    });

    syncCompanyVisibility(selects);
  } catch (error) {
    console.error('Errore caricamento aziende (API):', error);
    selects.forEach((select) => {
      select.innerHTML = '<option value="">Errore caricamento</option>';
    });
  }
}

export async function loadIncidents() {
  const container = document.getElementById('incidents-container');
  container.innerHTML = '<div class="loading">⏳ Caricamento...</div>';

  try {
    const data = await apiRequest('/incidents');
    state.currentIncidents = data || [];
    renderIncidentsList('incidents-container', state.currentIncidents);
  } catch (error) {
    console.error('Errore:', error);
    container.innerHTML = `<div class="message error">❌ Errore: ${error.message}</div>`;
  }
}

export async function loadIncidentsForSelect() {
  const select = document.getElementById('notif_incident_id');
  select.innerHTML = '<option value="">Caricamento...</option>';

  try {
    const data = await apiRequest('/incidents');
    state.currentIncidents = data || [];
    populateSelect(select, state.currentIncidents, 'Seleziona un incidente...');
  } catch (error) {
    console.error('Errore caricamento incidenti per select:', error);
    select.innerHTML = '<option value="">Errore caricamento incidenti</option>';
  }
}

export function bindIncidentForm() {
  const incidentForm = document.getElementById('incidenti-form');
  incidentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';

    try {
      const incidentData = {
        company_id: document.getElementById('inc_company_id').value,
        title: document.getElementById('inc_title').value,
        incident_datetime: document.getElementById('inc_datetime').value,
        severity: document.getElementById('inc_severity').value,
        status: document.getElementById('inc_status').value,
        incident_type: document.getElementById('inc_type').value,
        description: document.getElementById('inc_description').value,
      };

      await apiRequest('/incidents', {
        method: 'POST',
        body: JSON.stringify(incidentData),
      });

      displayMessage('incidenti-message', 'success', '✅ Incidente salvato!');
      e.target.reset();
    } catch (error) {
      console.error('Errore:', error);
      displayMessage('incidenti-message', 'error', '❌ Errore: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Salva Incidente';
    }
  });
}

export async function bindDesignationForm() {
  const designationForm = document.getElementById('designazione-form');
  designationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!['admin', 'csirt'].includes(state.currentUser?.role)) {
      displayMessage('designazione-message', 'error', 'Non hai i permessi per questa operazione');
      return;
    }

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';

    try {
      const companyData = {
        name: document.getElementById('company_name').value,
        vat_number: document.getElementById('company_vat').value,
        fiscal_code: document.getElementById('company_fiscal_code').value,
        sector: document.getElementById('company_sector').value,
        address: document.getElementById('company_address').value,
      };

      const designationData = {
        data_nomina: document.getElementById('data_nomina').value,
        main_role: document.getElementById('main_role').value,
        main_name: document.getElementById('main_name').value,
        main_surname: document.getElementById('main_surname').value,
        main_fiscal_code: document.getElementById('main_fiscal_code').value,
        main_email: document.getElementById('main_email').value,
        main_phone: document.getElementById('main_phone').value,
        acn_contact_name: document.getElementById('acn_contact_name').value,
        acn_contact_surname: document.getElementById('acn_contact_surname').value,
        acn_contact_email: document.getElementById('acn_contact_email').value,
        sub_1_name: document.getElementById('sub_1_name').value || null,
        sub_1_surname: document.getElementById('sub_1_surname').value || null,
        sub_1_email: document.getElementById('sub_1_email').value || null,
        sub_2_name: document.getElementById('sub_2_name').value || null,
        sub_2_surname: document.getElementById('sub_2_surname').value || null,
        sub_2_email: document.getElementById('sub_2_email').value || null,
        motivation_notes: document.getElementById('motivation_notes').value || null,
      };

      await apiRequest('/designations', {
        method: 'POST',
        body: JSON.stringify({ companyData, designationData }),
      });

      displayMessage('designazione-message', 'success', '✅ Designazione salvata con successo!');
      loadCompaniesForSelect();
    } catch (error) {
      console.error('Errore nel salvataggio Designazione:', error);
      displayMessage('designazione-message', 'error', '❌ Errore nel salvataggio: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Salva Designazione';
    }
  });
}

export function bindConfigurationForm() {
  const configForm = document.getElementById('configurazione-form');
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';

    try {
      const configData = {
        company_id: document.getElementById('cfg_company_id').value,
        topology_type: document.getElementById('topology_type').value,
        sites_count: parseInt(document.getElementById('sites_count').value, 10) || null,
        users_count: parseInt(document.getElementById('users_count').value, 10) || null,
        firewall_type: document.getElementById('firewall_type').value,
        firewall_model: document.getElementById('firewall_model').value,
      };

      await apiRequest('/configurations', {
        method: 'POST',
        body: JSON.stringify(configData),
      });

      displayMessage('configurazione-message', 'success', '✅ Configurazione salvata!');
      e.target.reset();
    } catch (error) {
      console.error('Errore:', error);
      displayMessage('configurazione-message', 'error', '❌ Errore: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Salva Configurazione';
    }
  });
}
