import { initAuth, showApp } from './auth.js';
import {
  bindConfigurationForm,
  bindDesignationForm,
  bindIncidentForm,
  loadCompaniesForSelect,
  loadIncidents,
  loadIncidentsForSelect,
} from './incidents.js';
import { bindNotificationForm, bindNotificationIncidentSelect, loadNotifications } from './notifications.js';
import { bindUserForm, bindUserRoleToggle, loadCompaniesForUserForm, loadUsers } from './users.js';
import { setActiveSection } from './ui.js';

function handleSectionEnter(sectionName) {
  if (sectionName === 'configurazione' || sectionName === 'incidenti' || sectionName === 'designazione') {
    loadCompaniesForSelect();
  } else if (sectionName === 'visualizza') {
    loadIncidents();
  } else if (sectionName === 'notifiche') {
    loadIncidentsForSelect();
    loadNotifications();
  } else if (sectionName === 'utenti') {
    loadUsers();
    loadCompaniesForUserForm();
  }
}

function setupNavigation() {
  document.querySelectorAll('#main-nav .nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionName = btn.dataset.target;
      setActiveSection(sectionName);
      handleSectionEnter(sectionName);
    });
  });

  const refreshButton = document.getElementById('refresh-incidents');
  refreshButton.addEventListener('click', loadIncidents);
}

function onAuthenticated() {
  showApp();
  const activeSection = document.querySelector('.nav-btn.active')?.dataset.target;
  if (activeSection) {
    handleSectionEnter(activeSection);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  bindIncidentForm();
  bindDesignationForm();
  bindConfigurationForm();
  bindNotificationForm();
  bindNotificationIncidentSelect();
  bindUserForm();
  bindUserRoleToggle();
  initAuth(onAuthenticated);
});
