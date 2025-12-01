export interface StatsData {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  transaction_count: number;
}

export function isStatsData(data: unknown): data is StatsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'total_income' in data &&
    'total_expenses' in data &&
    'net_balance' in data &&
    'transaction_count' in data
  );
}

