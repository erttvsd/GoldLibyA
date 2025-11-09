export const formatCurrency = (amount: number, currency: 'LYD' | 'USD' = 'LYD'): string => {
  return new Intl.NumberFormat('en-LY', {
    style: 'currency',
    currency: currency === 'LYD' ? 'LYD' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-LY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatGrams = (grams: number): string => {
  return `${formatNumber(grams, 3)}g`;
};

export const calculateStorageFee = (pickupDeadline: string): { overdue: boolean; days: number; fee: number } => {
  const deadline = new Date(pickupDeadline);
  const now = new Date();
  const diffMs = now.getTime() - deadline.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { overdue: false, days: 0, fee: 0 };
  }

  return {
    overdue: true,
    days: diffDays,
    fee: diffDays * 30,
  };
};

export const getDaysUntilDeadline = (deadline: string): number => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
