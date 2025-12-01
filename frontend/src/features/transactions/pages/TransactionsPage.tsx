// features/transactions/pages/TransactionsPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Download, TrendingUp, TrendingDown, DollarSign, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../../core/components/composite/PageHeader';
import { DataTable, type Column } from '../../../core/components/composite/DataTable';
import { Button } from '../../../core/components/atomic/Button';
import { Card, CardHeader, CardBody } from '../../../core/components/atomic/Card';
import { Badge } from '../../../core/components/atomic/Badge';
import { CurrencyText } from '../../../core/components/atomic/CurrencyText';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../core/components/composite/EmptyState';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactionStats,
} from '../hooks/useTransactions';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionFilterModal, type TransactionFilters } from '../components/TransactionFilterModal';
import { TransactionExportModal } from '../components/TransactionExportModal';
import { TransactionUpdate, type Transaction, type TransactionCreate } from '../types';
import type { SupportedCurrency } from '@/utils/currency';

export const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({});

  // Initialize filters from URL query parameters
  useEffect(() => {
    const accountId = searchParams.get('account_id');
    if (accountId) {
      setFilters((prev) => ({ ...prev, account_id: accountId }));
    }
  }, [searchParams]);

  // Data fetching
  const { transactions: transactions, isLoading } = useTransactions();
  const { stats: stats } = useTransactionStats();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((txn) => {
      // Date range filter
      if (filters.dateFrom && new Date(txn.transaction_date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(txn.transaction_date) > new Date(filters.dateTo)) {
        return false;
      }

      const amountVal: number = +txn.amount; 
      // Amount range filter
      if (filters.minAmount !== undefined && amountVal < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amountVal > filters.maxAmount) {
        return false;
      }

      // Type filter
      if (filters.types && filters.types.length > 0 && !filters.types.includes(txn.transaction_type)) {
        return false;
      }

      // Category filter
      if (
        filters.categories &&
        filters.categories.length > 0 &&
        (!txn.category_id || !filters.categories.includes(txn.category_id))
      ) {
        return false;
      }

      // Merchant name filter
      if (
        filters.merchantName &&
        (!txn.merchant_name ||
          !txn.merchant_name.toLowerCase().includes(filters.merchantName.toLowerCase()))
      ) {
        return false;
      }

      // Account filter
      if (filters.accountId && txn.account_id !== filters.accountId) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Handlers
  const handleCreate = async (data: TransactionCreate) => {
    try {
      await createMutation.createTransaction(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleUpdate = async (data: TransactionUpdate) => {
    if (!editingTransaction) return;

    try {
      await updateMutation.updateTransaction(
        editingTransaction.id,
        data
      );
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('transactions.deleteConfirm'))) {
      try {
        await deleteMutation.deleteTransaction(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleApplyFilters = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    // Also clear URL query parameters
    setSearchParams({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      label: t('transactions.transaction_date'),
      sortable: true,
      render: (item) => (
        <span className="text-sm font-medium">
          {format(new Date(item.transaction_date), 'MMM dd, yyyy')}
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
          {item.merchant_name && (
            <div className="text-xs text-neutral-500">{item.merchant_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: t('transactions.category_id'),
      render: (item) =>
        item.category_id ? (
          <Badge variant="secondary" size="sm">
            {item.category_id}
          </Badge>
        ) : (
          <span className="text-neutral-400 text-sm">-</span>
        ),
      width: '140px',
    },
    {
      key: 'type',
      label: t('transactions.transaction_type'),
      render: (item) => (
        <Badge variant={item.transaction_type === 'income' ? 'success' : 'danger'} size="sm">
          {t(`transactions.transaction_types.${item.transaction_type}`)}
        </Badge>
      ),
      width: '100px',
    },
    {
      key: 'amount',
      label: t('transactions.amount'),
      sortable: true,
      align: 'right',
      render: (item) => (
        <CurrencyText
          value={item.amount}
          currency={item.currency as SupportedCurrency}
          showSign
          colorCoded={false}
          className={`text-sm font-semibold ${
            item.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}
        />
      ),
      width: '130px',
    },
    {
      key: 'actions',
      label: '',
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingTransaction(item)}
            title={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
      width: '120px',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('nav.transactions') },
        ]}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setIsFilterModalOpen(true)}
            >
              {t('common.filter')}
              {activeFiltersCount > 0 && (
                <Badge variant="primary" size="sm" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
              disabled={!filteredTransactions || filteredTransactions.length === 0}
            >
              {t('common.export')}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t('transactions.newTransaction')}
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active Filters Banner */}
        {activeFiltersCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  {activeFiltersCount} {t('common.filter').toLowerCase()}
                  {activeFiltersCount > 1 ? 's' : ''} active
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              {filters.accountId && (
                <div>
                  <strong>Account ID:</strong> {filters.accountId}
                </div>
              )}
              <div>
                Showing <strong>{filteredTransactions.length}</strong> of{' '}
                <strong>{transactions?.length || 0}</strong> {t('transactions.title').toLowerCase()}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="elevated">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('transactions.totalIncome')}</p>
                    <CurrencyText
                      value={stats.total_income}
                      className="text-2xl font-bold text-green-600 mt-1"
                    />
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('transactions.totalExpenses')}</p>
                    <CurrencyText
                      value={stats.total_expenses}
                      className="text-2xl font-bold text-red-600 mt-1"
                    />
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('transactions.balance')}</p>
                    <CurrencyText
                      value={stats.net_balance}
                      colorCoded
                      className="text-2xl font-bold mt-1"
                    />
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Transactions Table */}
        <Card variant="elevated" padding="none">
          <CardHeader title={t('transactions.allTransactions')} className="px-6 pt-6" />
          <CardBody className="p-6">
            {!isLoading && filteredTransactions.length === 0 ? (
              <EmptyState
                icon={<DollarSign />}
                title={
                  activeFiltersCount > 0
                    ? 'No transactions match your filters'
                    : t('transactions.noTransactions')
                }
                description={
                  activeFiltersCount > 0
                    ? 'Try adjusting your filter criteria'
                    : t('transactions.noTransactionsDesc')
                }
                action={
                  activeFiltersCount > 0
                    ? {
                        label: 'Clear Filters',
                        onClick: handleClearFilters,
                      }
                    : {
                        label: t('transactions.addTransaction'),
                        onClick: () => setIsCreateModalOpen(true),
                        icon: <Plus className="h-4 w-4" />,
                      }
                }
              />
            ) : (
              <DataTable
                data={filteredTransactions}
                columns={columns}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                hoverable
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Create Transaction Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('transactions.createTransaction')}
      >
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isCreating}
        />
      </Modal>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          title={t('transactions.editTransaction')}
        >
          <TransactionForm
            onSubmit={handleUpdate}
            onCancel={() => setEditingTransaction(null)}
            isLoading={updateMutation.isUpdating}
            initialData={{
              accountId: editingTransaction.account_id,
              type: editingTransaction.transaction_type,
              amount: editingTransaction.amount,
              currency: editingTransaction.currency,
              category: editingTransaction.category_id,
              description: editingTransaction.description,
              date: editingTransaction.transaction_date,
              merchantName: editingTransaction.merchant_name,
              notes: editingTransaction.notes,
            }}
          />
        </Modal>
      )}

      {/* Filter Modal */}
      <TransactionFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Export Modal */}
      <TransactionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={filteredTransactions}
        includeFilters={activeFiltersCount > 0}
      />
    </div>
  );
};
