export function formatSalary(amount: number, currency: string): string {
  const safeCurrency = currency && currency.length === 3 ? currency.toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${safeCurrency} ${Math.round(amount).toLocaleString('en-US')}`;
  }
}

export function levelToPercent(level: string): number {
  switch (level) {
    case 'advanced':
      return 100;
    case 'intermediate':
      return 66;
    case 'beginner':
      return 33;
    default:
      return 6;
  }
}

export function importanceColor(importance: string): string {
  switch (importance) {
    case 'critical':
      return 'bg-danger';
    case 'high':
      return 'bg-caution';
    case 'medium':
      return 'bg-info';
    default:
      return 'bg-muted';
  }
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-positive';
  if (score >= 50) return 'text-caution';
  return 'text-danger';
}
