// features/accounts/pages/AccountsPage.tsx
import { useState } from 'react';
import { PlusCircle, Wallet, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Button } from '@/core/components/atomic/Button';
import { Spinner } from '@/core/components/atomic/Spinner';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { EntityCard, EntityCardGrid } from '@/components/ui/EntityCard';
import { Alert, BannerAlert } from '@/components/ui/Alert';
import { useConfirm } from '@/hooks/useConfirm';
import { AccountForm } from '../components/AccountForm';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '../hooks/useAccounts';
import type { AccountResponse, AccountCreate, AccountUpdate, AccountStatusInfo } from '../types';

export const AccountsPage = () => {
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null);

  // Data fetching
  const { accounts, isLoading, error: loadError } = useAccounts();

  // Mutations
  const { createAccount, isCreating, error: createError, reset: resetCreate } = useCreateAccount();
  const { updateAccount, isUpdating, error: updateError, reset: resetUpdate } = useUpdateAccount();
  const { deleteAccount, isDeleting } = useDeleteAccount();

  // Handlers
  const handleCreate = async (data: AccountCreate) => {
    try {
      await createAccount(data);
      setShowCreateModal(false);
      resetCreate();
    } catch (error) {
      // Error is already stored in createError
      console.error('Failed to create account:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: AccountUpdate) => {
    if (!editingAccount) return;

    try {
      await updateAccount(editingAccount.id, data);
      setEditingAccount(null);
      resetUpdate();
    } catch (error) {
      // Error is already stored in updateError
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  const handleDelete = async (account: AccountResponse) => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: `Are you sure you want to delete "${account.name}"? This will also delete all associated transactions. This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      confirmButtonVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteAccount(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  // Utilities
  const getBalanceStatus = (account: AccountResponse): AccountStatusInfo | undefined => {
    const balance = parseFloat(account.current_balance);

    if (balance < 0) {
      return { status: 'overdrawn', label: 'Overdrawn', variant: 'error' };
    } else if (balance < 100) {
      return { status: 'low', label: 'Low Balance', variant: 'warning' };
    } else if (balance > 10000) {
      return { status: 'high', label: 'High Balance', variant: 'success' };
    }

    return undefined;
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-red-600';
    if (balance < 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title="Accounts"
        subtitle="Manage your financial accounts"
        actions={
          <Button
            variant="primary"
            leftIcon={<PlusCircle />}
            onClick={() => setShowCreateModal(true)}
            isLoading={isCreating}
          >
            New Account
          </Button>
        }
      />

      {/* Error Alert */}
      {loadError && (
        <Alert variant="error" closable className="mb-6">
          Failed to load accounts. Please try again later.
        </Alert>
      )}

      {/* Summary Banner */}
      {accounts.length > 0 && (
        <BannerAlert variant="info" className="mb-6" closable={false}>
          <div className="flex items-center justify-between">
            <span>
              <strong>{accounts.length}</strong> account{accounts.length !== 1 ? 's' : ''} •{' '}
              <strong>Total balance:</strong> {calculateTotalBalance().toFixed(2)} EUR
            </span>
          </div>
        </BannerAlert>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title="No accounts yet"
          description="Get started by creating your first account to track your finances"
          action={{
            label: 'Create Account',
            onClick: () => setShowCreateModal(true),
            icon: <PlusCircle />,
          }}
        />
      ) : (
        /* Account Cards */
        <EntityCardGrid columns={3}>
          {accounts.map((account) => {
            const balance = parseFloat(account.current_balance);
            const initialBalance = parseFloat(account.initial_balance);
            const change = balance - initialBalance;
            const changePercentage =
              initialBalance !== 0 ? (change / initialBalance) * 100 : 0;

            return (
              <EntityCard
                key={account.id}
                title={account.name}
                subtitle={`${account.currency} Account`}
                headerIcon={<Wallet className="h-5 w-5" />}
                status={getBalanceStatus(account)}
                metadata={[
                  {
                    label: 'Current Balance',
                    value: (
                      <span className={`font-bold ${getBalanceColor(balance)}`}>
                        {account.currency} {balance.toFixed(2)}
                      </span>
                    ),
                    highlight: true,
                  },
                  {
                    label: 'Initial Balance',
                    value: `${account.currency} ${initialBalance.toFixed(2)}`,
                  },
                  {
                    label: 'Change',
                    value: (
                      <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {change >= 0 ? '+' : ''}
                        {change.toFixed(2)} ({changePercentage.toFixed(1)}%)
                      </span>
                    ),
                  },
                ]}
                actions={{
                  onEdit: () => setEditingAccount(account),
                  onDelete: () => handleDelete(account),
                  customActions: [
                    {
                      label: 'View Transactions',
                      icon: <TrendingUp size={16} />,
                      onClick: () => {
                        // TODO: Navigate to transactions page with account filter
                        console.log('View transactions for account:', account.id);
                      },
                    },
                  ],
                }}
                className={isDeleting ? 'opacity-50' : ''}
              />
            );
          })}
        </EntityCardGrid>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreate();
        }}
        title="Create New Account"
        size="md"
        preventClose={isCreating}
        footer={
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetCreate();
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="account-form"
              isLoading={isCreating}
            >
              Create Account
            </Button>
          </ModalFooter>
        }
      >
        <AccountForm
          onSubmit={handleCreate}
          isLoading={isCreating}
          error={createError ? 'Failed to create account. Please try again.' : undefined}
          onClearError={resetCreate}
        />
      </Modal>

      {/* Edit Modal */}
      {editingAccount && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingAccount(null);
            resetUpdate();
          }}
          title="Edit Account"
          size="md"
          preventClose={isUpdating}
          footer={
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingAccount(null);
                  resetUpdate();
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="account-form"
                isLoading={isUpdating}
              >
                Save Changes
              </Button>
            </ModalFooter>
          }
        >
          <AccountForm
            account={editingAccount}
            onSubmit={handleUpdate}
            isLoading={isUpdating}
            error={updateError ? 'Failed to update account. Please try again.' : undefined}
            onClearError={resetUpdate}
          />
        </Modal>
      )}
    </div>
  );
};
