// src/utils/validation.js
export const validateForm = (form, rules) => {
  const errors = {};

  for (const field in rules) {
    const value = form[field];
    const rule = rules[field];

    // ── Required ────────────────────────────────────────────
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rule.msg || `${field.replace(/_/g, ' ')} is required.`;
      continue; // skip further checks — value is empty
    }

    // Skip remaining checks if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) continue;

    // ── Number ──────────────────────────────────────────────
    if (rule.type === 'number' && (isNaN(value) || Number(value) <= 0)) {
      errors[field] = rule.msg || `${field.replace(/_/g, ' ')} must be a number greater than 0.`;
    }

    // ── Date: cannot be in the future ───────────────────────
    if (rule.notFuture) {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // allow today itself
      if (inputDate > today) {
        errors[field] = rule.msg || `${field.replace(/_/g, ' ')} cannot be a future date.`;
      }
    }

    // 🛑 NEW: Date: minimum age check ────────────────────────
    if (rule.minAge && !errors[field]) { // Only check if there isn't already a "future date" error
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      
      // Subtract 1 from age if the birthday hasn't occurred yet this year
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < rule.minAge) {
        errors[field] = rule.minAgeMsg || `Must be at least ${rule.minAge} years old.`;
      }
    }

    // ── Date: must be strictly after another field ───────────
    if (rule.afterField) {
      const otherValue = form[rule.afterField];
      if (otherValue) {
        const thisDate  = new Date(value);
        const otherDate = new Date(otherValue);
        if (thisDate <= otherDate) {
          errors[field] = rule.msg ||
            `${field.replace(/_/g, ' ')} must be after ${rule.afterField.replace(/_/g, ' ')}.`;
        }
      }
    }
  }

  return errors;
};