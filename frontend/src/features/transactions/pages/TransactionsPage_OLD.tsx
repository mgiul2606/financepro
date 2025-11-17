import { useState } from 'react';
import { Plus, Filter, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../../core/components/composite/PageHeader';
import { DataTable, type Column } from '../../../core/components/composite/DataTable';
import { Button } from '../../../core/components/atomic/Button';
import { Card, CardHeader, CardBody } from '../../../core/components/atomic/Card';
import { Badge } from '../../../core/components/atomic/Badge';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../core/components/composite/EmptyState';
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactionStats,
} from '../hooks/useTransactions';
import { TransactionForm } from '../components/TransactionForm';
import { type Transaction, type TransactionCreate } from '../types';

export const TransactionsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: transactions, isLoading } = useTransactions();
  const { data: stats } = useTransactionStats();
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();

  const handleCreate = async (data: TransactionCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      label: 'Date',
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
      label: 'Description',
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
      label: 'Category',
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
      label: 'Type',
      render: (item) => (
        <Badge
          variant={item.type === 'income' ? 'success' : 'danger'}
          size="sm"
        >
          {item.type}
        </Badge>
      ),
      width: '100px',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span
          className={`text-sm font-semibold ${
            item.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {item.type === 'income' ? '+' : '-'}
          {item.currency} {item.amount.toFixed(2)}
        </span>
      ),
      width: '130px',
    },
    {
      key: 'actions',
      label: '',
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(item.id)}
        >
          Delete
        </Button>
      ),
      width: '80px',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Transactions"
        subtitle="Track and manage all your financial transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Transactions' },
        ]}
        actions={
          <>
            <Button variant="ghost" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
            <Button variant="ghost" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Transaction
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="elevated">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      EUR {stats.totalIncome.toFixed(2)}
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
                    <p className="text-sm text-neutral-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      EUR {stats.totalExpenses.toFixed(2)}
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
                    <p className="text-sm text-neutral-600">Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      EUR {stats.balance.toFixed(2)}
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
          <CardHeader title="All Transactions" className="px-6 pt-6" />
          <CardBody className="p-6">
            {!isLoading && transactions && transactions.length === 0 ? (
              <EmptyState
                icon={<DollarSign />}
                title="No transactions yet"
                description="Start tracking your finances by adding your first transaction"
                action={{
                  label: 'Add Transaction',
                  onClick: () => setIsCreateModalOpen(true),
                  icon: <Plus className="h-4 w-4" />
                }}
              />
            ) : (
              <DataTable
                data={transactions || []}
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
        title="Create Transaction"
      >
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};
