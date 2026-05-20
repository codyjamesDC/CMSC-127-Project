export const validateForm = (form, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const value = form[field];
    const rule = rules[field];

    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = `${field.replace('_', ' ')} is required.`;
    } 
    else if (rule.type === 'number' && (isNaN(value) || Number(value) <= 0)) {
      errors[field] = `${field.replace('_', ' ')} must be a number greater than 0.`;
    }
  }
  return errors;
};