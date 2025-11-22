// src/features/recurring/pages/RecurringPage.tsx
import { useState } from 'react';
import { RefreshCw, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { Card, CardHeader, CardBody } from '@/core/components/atomic/Card';
import { Button } from '@/core/components/atomic/Button';
import { Badge } from '@/core/components/atomic/Badge';
import { CurrencyText } from '@/core/components/atomic/CurrencyText';
import { DataTable, type Column } from '@/core/components/composite/DataTable';

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextOccurrence: string;
  isActive: boolean;
  type: 'income' | 'expense';
  hasAnomaly: boolean;
}

export const RecurringPage = () => {
  const { t } = useTranslation();
  const [recurring] = useState<RecurringTransaction[]>([]);

  const columns: Column<RecurringTransaction>[] = [
    {
      key: 'name',
      label: t('recurring.name'),
      render: (txn) => (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{txn.name}</span>
          {txn.hasAnomaly && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: t('recurring.amount'),
      render: (txn) => (
        <span className={txn.type === 'income' ? 'text-green-600' : 'text-red-600'}>
          {txn.type === 'income' ? '+' : '-'}
          <CurrencyText value={txn.amount} currency={txn.currency as any} />
        </span>
      ),
    },
    {
      key: 'frequency',
      label: t('recurring.frequency'),
      render: (txn) => (
        <Badge variant="info">{t(`recurring.${txn.frequency}`)}</Badge>
      ),
    },
    {
      key: 'nextOccurrence',
      label: t('recurring.nextDate'),
      render: (txn) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {new Date(txn.nextOccurrence).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('recurring.status'),
      render: (txn) => (
        <Badge variant={txn.isActive ? 'success' : 'warning'}>
          {txn.isActive ? t('recurring.active') : t('recurring.paused')}
        </Badge>
      ),
    },
  ];

  const monthlyIncome = recurring
    .filter((r) => r.isActive && r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const monthlyExpenses = recurring
    .filter((r) => r.isActive && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-8">
      <PageHeader
        title={t('recurring.title')}
        subtitle={t('recurring.subtitle')}
        actions={
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            {t('recurring.addRecurring')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('recurring.monthlyIncome')}</p>
            <h3 className="text-2xl font-bold text-green-600">
              <CurrencyText value={monthlyIncome} />
            </h3>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('recurring.monthlyExpenses')}</p>
            <h3 className="text-2xl font-bold text-red-600">
              <CurrencyText value={monthlyExpenses} />
            </h3>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody className="p-6">
            <p className="text-sm text-gray-600 mb-1">{t('recurring.netMonthly')}</p>
            <h3 className={`text-2xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <CurrencyText value={monthlyIncome - monthlyExpenses} showSign />
            </h3>
          </CardBody>
        </Card>
      </div>

      {/* Recurring Transactions List */}
      <Card variant="bordered">
        <CardHeader
          title={t('recurring.yourRecurring')}
          subtitle={t('recurring.manageRecurring')}
        />
        <CardBody>
          {recurring.length > 0 ? (
            <DataTable
              data={recurring}
              columns={columns}
              keyExtractor={(txn) => txn.id}
            />
          ) : (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('recurring.noRecurringYet')}</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                {t('recurring.addFirstRecurring')}
              </p>
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                {t('recurring.addRecurring')}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default RecurringPage;
