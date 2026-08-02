/**
 * 🔍 Validateurs réutilisables pour les formulaires
 * Uniformise la validation côté client
 */

// Email
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { valid: regex.test(email), message: regex.test(email) ? '' : 'Email invalide' };
};

// Mot de passe
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Minimum 6 caractères' };
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: 'Au moins 1 majuscule et 1 chiffre requis' };
  }
  return { valid: true, message: '' };
};

// Téléphone
export const validatePhone = (phone) => {
  const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return { valid: regex.test(phone), message: regex.test(phone) ? '' : 'Téléphone invalide' };
};

// Montant (nombre positif)
export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return {
    valid: !isNaN(num) && num > 0,
    message: !isNaN(num) && num > 0 ? '' : 'Montant invalide (positif requis)',
  };
};

// Nombre requis
export const validateRequired = (value) => {
  const valid = value !== null && value !== undefined && value !== '';
  return { valid, message: valid ? '' : 'Champ requis' };
};

// Min/Max
export const validateLength = (value, min, max) => {
  const len = String(value).length;
  if (len < min) return { valid: false, message: `Minimum ${min} caractères` };
  if (len > max) return { valid: false, message: `Maximum ${max} caractères` };
  return { valid: true, message: '' };
};

// Combinaison de validateurs
export const validateForm = (data, rules) => {
  const errors = {};
  Object.keys(rules).forEach(field => {
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    const value = data[field];

    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.valid) {
        errors[field] = result.message;
        break;
      }
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
};

// Exemple d'utilisation:
// const errors = validateForm(formData, {
//   email: validateEmail,
//   password: validatePassword,
//   amount: validateAmount,
// });
