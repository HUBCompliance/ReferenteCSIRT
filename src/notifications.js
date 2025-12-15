import { apiRequest } from './api.js';
import { state } from './state.js';
import { displayMessage, renderNotifications } from './ui.js';

export function bindNotificationForm() {
  const form = document.getElementById('notifiche-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Invio Notifica...';

    try {
      const incidentId = document.getElementById('notif_incident_id').value;
      const incident = state.currentIncidents.find((i) => i.id === incidentId);

      if (!incident) {
        throw new Error('Seleziona un incidente valido.');
      }

      const notificationData = {
        incident_id: incidentId,
        company_id: incident.company_id,
        notification_title: document.getElementById('notif_notification_title').value,
        notification_datetime: incident.incident_datetime,
        impact_notes: document.getElementById('notif_impact_notes').value,
        status: document.getElementById('notif_status').value,
        risk_damage_notes: document.getElementById('notif_risk_damage_notes').value,
        corrective_actions_notes: document.getElementById('notif_corrective_actions_notes').value,
      };

      await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });

      displayMessage('notifiche-message', 'success', '✅ Notifica salvata e inviata!');
      e.target.reset();
      loadNotifications();
    } catch (error) {
      console.error('Errore:', error);
      displayMessage('notifiche-message', 'error', '❌ Errore: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Salva Notifica';
    }
  });
}

export function bindNotificationIncidentSelect() {
  const incidentSelect = document.getElementById('notif_incident_id');
  incidentSelect.addEventListener('change', function onChange() {
    const selectedId = this.value;
    const incident = state.currentIncidents.find((i) => i.id === selectedId);

    if (incident) {
      document.getElementById('notif_notification_title').value = incident.title;
      document.getElementById('notif_datetime').value = incident.incident_datetime.substring(0, 16);
    } else {
      document.getElementById('notif_notification_title').value = '';
      document.getElementById('notif_datetime').value = '';
    }
  });
}

export async function loadNotifications() {
  const container = document.getElementById('notifications-list');
  container.innerHTML = '<div class="loading">⏳ Caricamento notifiche...</div>';

  try {
    const data = await apiRequest('/notifications');
    renderNotifications('notifications-list', data || []);
  } catch (error) {
    console.error('Errore caricamento notifiche:', error);
    container.innerHTML = `<div class="message error">❌ Errore: ${error.message}</div>`;
  }
}
