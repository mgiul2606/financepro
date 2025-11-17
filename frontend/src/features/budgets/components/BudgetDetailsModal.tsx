// features/budgets/components/BudgetDetailsModal.tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Card, CardBody } from '@/core/components/atomic/Card';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText } from '@/core/components/atomic/CurrencyText';
import { DataTable, type Column } from '@/core/components/composite/DataTable';
import { EmptyState } from '@/core/components/composite/EmptyState';
import type { Budget } from '../types';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import type { Transaction } from '@/features/transactions/types';
import type { SupportedCurrency } from '@/utils/currency';

interface BudgetDetailsModalProps {
  budget: Budget;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetDetailsModal = ({
  budget,
  isOpen,
  onClose,
}: BudgetDetailsModalProps) => {
  const { t } = useTranslation();
  const { data: allTransactions, isLoading } = useTransactions();

  // Filter transactions for this budget
  const budgetTransactions = useMemo(() => {
    if (!allTransactions) return [];

    return allTransactions.filter((txn) => {
      // Only expense transactions
      if (txn.type !== 'expense') return false;

      // Match category
      if (txn.category !== budget.category) return false;

      // Within budget date range
      const txnDate = new Date(txn.date);
      const budgetStart = new Date(budget.startDate);
      const budgetEnd = new Date(budget.endDate);

      return txnDate >= budgetStart && txnDate <= budgetEnd;
    });
  }, [allTransactions, budget]);

  const percentage = (budget.spent / budget.amount) * 100;
  const remaining = budget.amount - budget.spent;

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      label: t('transactions.date'),
      sortable: true,
      render: (item) => (
        <span className="text-sm font-medium">
          {format(new Date(item.date), 'MMM dd, yyyy')}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'description',
      label: t('transactions.description'),
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium text-sm">{item.description}</div>
          {item.merchantName && (
            <div className="text-xs text-neutral-500">{item.merchantName}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('transactions.amount'),
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="text-sm font-semibold text-red-600">
          -<CurrencyText value={item.amount} currency={item.currency as SupportedCurrency} />
        </span>
      ),
      width: '130px',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('budgets.budgetDetails')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Budget Overview */}
        <Card variant="bordered" className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardBody className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{budget.name}</h3>
                <p className="text-sm text-neutral-600 mt-1">{budget.category}</p>
              </div>
              <Badge
                variant={
                  percentage >= 100
                    ? 'danger'
                    : percentage >= 80
                      ? 'warning'
                      : 'success'
                }
                size="sm"
              >
                {percentage.toFixed(0)}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600">{t('budgets.spent')}</span>
                <CurrencyText value={budget.spent} className="font-semibold" />
              </div>
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentage >= 100
                      ? 'bg-red-600'
                      : percentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Budget Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-600 mb-1">{t('budgets.amount')}</p>
                <CurrencyText
                  value={budget.amount}
                  className="text-lg font-bold text-neutral-900"
                />
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-600 mb-1">{t('budgets.spent')}</p>
                <CurrencyText
                  value={budget.spent}
                  className="text-lg font-bold text-red-600"
                />
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-600 mb-1">{t('budgets.remaining')}</p>
                <CurrencyText
                  value={remaining}
                  className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(budget.startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(budget.endDate), 'MMM dd, yyyy')}
              </span>
              <span className="mx-2">•</span>
              <span className="capitalize">{t(`budgets.periods.${budget.period}`)}</span>
            </div>
          </CardBody>
        </Card>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              {t('budgets.transactionsInBudget')}
            </h4>
            <Badge variant="default" size="sm">
              {budgetTransactions.length} {t('budgets.transactions').toLowerCase()}
            </Badge>
          </div>

          {budgetTransactions.length === 0 ? (
            <EmptyState
              icon={<TrendingDown />}
              title={t('budgets.noTransactionsInBudget')}
              description={`No expenses found in the "${budget.category}" category for this period`}
            />
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <DataTable
                data={budgetTransactions}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                hoverable
                compact
              />
            </div>
          )}
        </div>

        {/* Summary */}
        {budgetTransactions.length > 0 && (
          <Card variant="bordered" className="bg-neutral-50">
            <CardBody className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">{t('analytics.total')} {t('budgets.transactions')}</span>
                  <span className="font-semibold text-neutral-900">
                    {budgetTransactions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">{t('analytics.average')} per transaction</span>
                  <CurrencyText
                    value={budget.spent / budgetTransactions.length}
                    className="font-semibold text-neutral-900"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </Modal>
  );
};
