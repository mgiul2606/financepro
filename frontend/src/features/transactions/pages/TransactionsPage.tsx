// features/transactions/pages/TransactionsPage.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, Download, TrendingUp, TrendingDown, DollarSign, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../../core/components/composite/PageHeader';
import { DataTable, type Column } from '../../../core/components/composite/DataTable';
import { Button } from '../../../core/components/atomic/Button';
import { Card, CardHeader, CardBody } from '../../../core/components/atomic/Card';
import { Badge } from '../../../core/components/atomic/Badge';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
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
import { type Transaction, type TransactionCreate } from '../types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency } from '@/utils/currency';

export const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({});

  // Data fetching
  const { data: transactions, isLoading } = useTransactions();
  const { data: stats } = useTransactionStats();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((txn) => {
      // Date range filter
      if (filters.dateFrom && new Date(txn.date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(txn.date) > new Date(filters.dateTo)) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount !== undefined && txn.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && txn.amount > filters.maxAmount) {
        return false;
      }

      // Type filter
      if (filters.types && filters.types.length > 0 && !filters.types.includes(txn.type)) {
        return false;
      }

      // Category filter
      if (
        filters.categories &&
        filters.categories.length > 0 &&
        (!txn.category || !filters.categories.includes(txn.category))
      ) {
        return false;
      }

      // Merchant name filter
      if (
        filters.merchantName &&
        (!txn.merchantName ||
          !txn.merchantName.toLowerCase().includes(filters.merchantName.toLowerCase()))
      ) {
        return false;
      }

      // Account filter
      if (filters.accountId && txn.accountId !== filters.accountId) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Handlers
  const handleCreate = async (data: TransactionCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleUpdate = async (data: TransactionCreate) => {
    if (!editingTransaction) return;

    try {
      await updateMutation.mutateAsync({
        id: editingTransaction.id,
        data: data as any,
      });
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('transactions.deleteConfirm'))) {
      try {
        await deleteMutation.mutateAsync(id);
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
  };

  const activeFiltersCount = Object.keys(filters).length;

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
      key: 'category',
      label: t('transactions.category'),
      render: (item) =>
        item.category ? (
          <Badge variant="secondary" size="sm">
            {item.category}
          </Badge>
        ) : (
          <span className="text-neutral-400 text-sm">-</span>
        ),
      width: '140px',
    },
    {
      key: 'type',
      label: t('transactions.type'),
      render: (item) => (
        <Badge variant={item.type === 'income' ? 'success' : 'danger'} size="sm">
          {t(`transactions.types.${item.type}`)}
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
        <span
          className={`text-sm font-semibold ${
            item.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount, item.currency as any, preferences.locale)}
        </span>
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
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-900">
                <strong>{activeFiltersCount}</strong> {t('common.filter').toLowerCase()}
                {activeFiltersCount > 1 ? 's' : ''} active • Showing{' '}
                <strong>{filteredTransactions.length}</strong> of{' '}
                <strong>{transactions?.length || 0}</strong> {t('transactions.title').toLowerCase()}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
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
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(stats.totalIncome, preferences.currency, preferences.locale)}
                    </p>
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
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {formatCurrency(stats.totalExpenses, preferences.currency, preferences.locale)}
                    </p>
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
                    <p
                      className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(stats.balance, preferences.currency, preferences.locale)}
                    </p>
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
          isLoading={createMutation.isPending}
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
            isLoading={updateMutation.isPending}
            initialData={{
              accountId: editingTransaction.accountId,
              type: editingTransaction.type,
              amount: editingTransaction.amount,
              currency: editingTransaction.currency,
              category: editingTransaction.category,
              description: editingTransaction.description,
              date: editingTransaction.date,
              merchantName: editingTransaction.merchantName,
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
