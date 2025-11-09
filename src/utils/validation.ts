export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  if (!/^[0-9]{10,}$/.test(phone.replace(/[\s-]/g, ''))) return 'Invalid phone number';
  return null;
};

export const validateAmount = (amount: number, min = 0, max?: number): string | null => {
  if (isNaN(amount)) return 'Invalid amount';
  if (amount < min) return `Amount must be at least ${min}`;
  if (max && amount > max) return `Amount cannot exceed ${max}`;
  return null;
};

export const validateGrams = (grams: number, available?: number): string | null => {
  if (isNaN(grams)) return 'Invalid grams';
  if (grams <= 0) return 'Grams must be greater than 0';
  if (available !== undefined && grams > available) return `Insufficient balance (available: ${available}g)`;
  return null;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};
