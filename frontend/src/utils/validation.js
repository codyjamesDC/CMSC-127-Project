// src/utils/validation.js
export const validateForm = (form, rules) => {
  const errors = {};

  const LABELS = {
    license_no: 'License number',
    fname: 'First name',
    lname: 'Last name',
    mname: 'Middle name',
    bday: 'Date of birth',
    sex: 'Sex',
    nationality: 'Nationality',
    height_cm: 'Height (cm)',
    weight_kg: 'Weight (kg)',
    eye_color: 'Eye color',
    blood_type: 'Blood type',
    contact_no: 'Contact number',
    mother_fname: "Mother's first name",
    mother_lname: "Mother's last name",
    father_fname: "Father's first name",
    father_lname: "Father's last name",
    emrg_contact_person: 'Emergency contact person',
    emrg_contact_no: 'Emergency contact number',
    registration_number: 'Registration number',
    plate_no: 'Plate number',
    registration_date: 'Registration date',
    expiration_date: 'Expiration date',
    engine_no: 'Engine number',
    chassis_no: 'Chassis number',
    make: 'Make',
    model: 'Model',
    year: 'Year',
    color: 'Color',
    location: 'Location',
    date: 'Date',
    apprehending_officer: 'Apprehending officer',
    license_type: 'License type',
    license_status: 'License status'
  };

  const humanLabel = (field) => LABELS[field] || field.replace(/_/g, ' ');

  for (const field in rules) {
    const value = form[field];
    const rule = rules[field];

    // ── Required ────────────────────────────────────────────
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rule.msg || `${humanLabel(field)} is required.`;
      continue; // skip further checks — value is empty
    }

    // Skip remaining checks if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) continue;

    // ── Number ──────────────────────────────────────────────
    if (rule.type === 'number' && (isNaN(value) || Number(value) <= 0)) {
      errors[field] = rule.msg || `${humanLabel(field)} must be a number greater than 0.`;
    }

    // ── Date: cannot be in the future ───────────────────────
    if (rule.notFuture) {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // allow today itself
      if (inputDate > today) {
        errors[field] = rule.msg || `${humanLabel(field)} cannot be a future date.`;
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
            `${humanLabel(field)} must be after ${humanLabel(rule.afterField)}.`;
        }
      }
    }
  }

  return errors;
};