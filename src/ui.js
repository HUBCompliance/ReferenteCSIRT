import { state } from './state.js';

export function displayMessage(divId, type, content, options = {}) {
  const { persist = false } = options;
  const messageDiv = document.getElementById(divId);
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = content;
  messageDiv.style.display = 'block';

  if (!persist) {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

export function toggleScreens(showApp) {
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');

  if (showApp) {
    loginScreen.style.display = 'none';
    appScreen.classList.add('active');
  } else {
    loginScreen.style.display = 'block';
    appScreen.classList.remove('active');
  }
}

export function updateUserHeader(user) {
  const role = document.getElementById('current-user-role');
  const name = document.getElementById('current-user-name');
  role.textContent = translateRole(user.role);
  name.textContent = `${user.name}${user.company_name ? ' • ' + user.company_name : ''}`;
}

export function translateRole(role) {
  const labels = {
    admin: '👑 Amministratore',
    csirt: '🛡️ Referente CSIRT',
    company: '🏢 Referente Aziendale',
  };
  return labels[role] || role;
}

export function applyNavigationPermissions(userRole) {
  const navButtons = document.querySelectorAll('.nav-btn');
  let firstVisible = null;

  navButtons.forEach((btn) => {
    const permissions = btn.getAttribute('data-permission');
    const allowed = permissions ? permissions.split(',') : [];
    if (allowed.includes(userRole)) {
      btn.disabled = false;
      btn.style.display = '';
      if (!firstVisible) {
        firstVisible = btn;
      }
    } else {
      btn.disabled = true;
      btn.style.display = 'none';
    }
  });

  return firstVisible;
}

export function setActiveSection(sectionName) {
  document.querySelectorAll('.section').forEach((section) => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    btn.removeAttribute('aria-current');
  });

  const section = document.getElementById(sectionName);
  const button = Array.from(document.querySelectorAll('.nav-btn')).find((btn) => btn.dataset.target === sectionName);
  if (section) {
    section.classList.add('active');
    const heading = section.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
  if (button) {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-current', 'page');
  }
}

export function renderIncidentsList(containerId, incidents) {
  const container = document.getElementById(containerId);
  if (!incidents || incidents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>Nessun incidente</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = incidents
    .map(
      (incident) => `
        <div class="incident-card">
          <div class="incident-header">
            <div>
              <h3 class="incident-title">${incident.title}</h3>
              <p style="color: #666; margin-top: 5px;">
                ${incident.csirtcompanies?.name || 'N/A'} •
                ${new Date(incident.incident_datetime).toLocaleString('it-IT')}
              </p>
            </div>
            <div>
              <span class="severity-badge severity-${incident.severity}">${incident.severity}</span>
              <span class="status-badge status-${incident.status}">${incident.status}</span>
            </div>
          </div>
          <div class="incident-details">
            <p><strong>Tipo:</strong> ${incident.incident_type}</p>
            <p><strong>Descrizione:</strong> ${incident.description}</p>
          </div>
        </div>
      `
    )
    .join('');
}

export function renderNotifications(containerId, notifications) {
  const container = document.getElementById(containerId);
  if (!notifications || notifications.length === 0) {
    container.innerHTML = '<div class="empty-state">Nessuna notifica trovata.</div>';
    return;
  }

  container.innerHTML = notifications
    .map((notif) => {
      const statusClass = notif.status.toLowerCase().replace(' ', '-');
      const incidentRef = notif.csirtincidents?.title || 'Incidente Rimosso';

      return `
        <div class="incident-card" style="border-left: 5px solid #667eea;">
          <div class="incident-header">
            <div>
              <h3 class="incident-title">Notifica: ${incidentRef}</h3>
              <p style="color: #666; margin-top: 5px;">
                Incidente ID: ${notif.incident_id.substring(0, 8)}... •
                Stato: <span class="status-badge status-${statusClass}">${notif.status}</span>
              </p>
            </div>
          </div>
          <div class="incident-details">
            <p><strong>Danno/Impatto:</strong> ${notif.impact_notes || '-'}</p>
            <p><strong>Valutazione Rischio:</strong> ${notif.risk_damage_notes || '-'}</p>
            <p><strong>Azioni Correttive:</strong> ${notif.corrective_actions_notes || '-'}</p>
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderUsers(containerId, profiles) {
  const container = document.getElementById(containerId);
  if (!profiles || profiles.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">Nessun utente</p>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="padding: 12px; text-align: left;">Nome</th>
            <th style="padding: 12px; text-align: left;">ID (Email non disponibile)</th>
            <th style="padding: 12px; text-align: left;">Ruolo</th>
            <th style="padding: 12px; text-align: left;">Azienda</th>
          </tr>
        </thead>
        <tbody>
          ${profiles
            .map(
              (user) => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px;">${user.name}</td>
                <td style="padding: 12px; font-size: 10px;">${user.id}</td>
                <td style="padding: 12px;">
                  <span class="role-badge role-${user.role}">${user.role}</span>
                </td>
                <td style="padding: 12px;">${user.csirtcompanies?.name || '-'}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function resetSelect(select, placeholder) {
  const selectEl = select;
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
}

export function populateSelect(select, options, placeholder) {
  resetSelect(select, placeholder);
  options.forEach((item) => {
    select.innerHTML += `<option value="${item.id}">${item.name}</option>`;
  });
}

export function syncCompanyVisibility(selects) {
  selects.forEach((select) => {
    if (state.currentUser?.role === 'company' && state.currentUser.company_id) {
      select.value = state.currentUser.company_id;
      select.disabled = true;
    } else {
      select.disabled = false;
    }
  });
}
