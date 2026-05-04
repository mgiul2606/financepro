export function getProgressVariant(
  percentage: number
): 'destructive' | 'warning' | 'success' {
  if (percentage >= 100) return 'destructive';
  if (percentage >= 80) return 'warning';
  return 'success';
}

export function getProgressBarClass(percentage: number): string {
  if (percentage >= 100) return 'bg-expense';
  if (percentage >= 80) return 'bg-warning-finance';
  return 'bg-income';
}

export function getAmountVariant(amount: number): 'success' | 'destructive' {
  return amount >= 0 ? 'success' : 'destructive';
}

export function getAmountClass(amount: number): string {
  return amount >= 0 ? 'text-income' : 'text-expense';
}

export function getPriorityVariant(
  priority: string
): 'destructive' | 'warning' | 'secondary' {
  if (priority === 'high') return 'destructive';
  if (priority === 'medium') return 'warning';
  return 'secondary';
}

export function getDaysRemainingClass(days: number): string {
  if (days < 0) return 'text-expense';
  if (days <= 7) return 'text-warning-finance';
  return 'text-income';
}
