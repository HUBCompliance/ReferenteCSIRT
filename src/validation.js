export function setupFormValidation(form) {
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach((field) => {
    field.addEventListener('input', () => {
      clearFieldError(field);
    });
    field.addEventListener('blur', () => {
      if (field.checkValidity()) {
        clearFieldError(field);
      }
    });
  });
}

export function validateForm(form) {
  let firstInvalid = null;
  const fields = form.querySelectorAll('input, select, textarea');

  fields.forEach((field) => {
    const message = getFieldMessage(field);
    if (message) {
      setFieldError(field, message);
      if (!firstInvalid) {
        firstInvalid = field;
      }
    } else {
      clearFieldError(field);
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function getFieldMessage(field) {
  if (field.disabled) return '';

  field.setCustomValidity('');
  if (field.validity.valid) return '';

  if (field.validity.valueMissing) {
    return field.dataset.requiredMessage || 'Questo campo è obbligatorio.';
  }
  if (field.validity.patternMismatch) {
    return field.dataset.errorMessage || 'Formato non valido.';
  }
  if (field.validity.typeMismatch && field.dataset.typeError) {
    return field.dataset.typeError;
  }

  return field.validationMessage;
}

function setFieldError(field, message) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
  }
  field.setAttribute('aria-invalid', 'true');
}

function clearFieldError(field) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
  }
  field.removeAttribute('aria-invalid');
  field.setCustomValidity('');
}
