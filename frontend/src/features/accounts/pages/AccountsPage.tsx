// features/accounts/pages/AccountsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/core/components/composite/PageHeader';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Button } from '@/core/components/atomic/Button';
import { Spinner } from '@/core/components/atomic/Spinner';
import { CurrencyText, NumberText, PercentageText } from '@/core/components/atomic';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

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
      title: t('accounts.deleteAccount'),
      message: t('accounts.deleteConfirm', { name: account.name }),
      confirmText: t('common.delete'),
      variant: 'danger',
      confirmButtonVariant: 'danger',
    });

    if (confirmed) {
      setDeletingAccountId(account.id);
      try {
        await deleteAccount(account.id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      } finally {
        setDeletingAccountId(null);
      }
    }
  };

  // Utilities
  const getBalanceStatus = (account: AccountResponse): AccountStatusInfo | undefined => {
    const balance = parseFloat(account.current_balance);

    if (balance < 0) {
      return { status: 'overdrawn', label: t('accounts.status.overdrawn'), variant: 'error' };
    } else if (balance < 100) {
      return { status: 'low', label: t('accounts.status.lowBalance'), variant: 'warning' };
    } else if (balance > 10000) {
      return { status: 'high', label: t('accounts.status.highBalance'), variant: 'success' };
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
          <p className="mt-4 text-gray-600">{t('common.loadingEntity', { entity: t('nav.accounts').toLowerCase() })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <PageHeader
        title={t('accounts.title')}
        subtitle={t('accounts.subtitle')}
        actions={
          <Button
            variant="primary"
            leftIcon={<PlusCircle />}
            onClick={() => setShowCreateModal(true)}
            isLoading={isCreating}
          >
            {t('accounts.newAccount')}
          </Button>
        }
      />

      {/* Error Alert */}
      {loadError && (
        <Alert variant="error" closable className="mb-6">
          {t('accounts.errors.loadFailed')}
        </Alert>
      )}

      {/* Summary Banner */}
      {accounts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Accounts */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('accounts.totalAccounts')}</p>
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              </div>
            </div>

            {/* Total Balance */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('accounts.totalBalance')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyText value={calculateTotalBalance()} />
                </p>
              </div>
            </div>

            {/* Active Accounts */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('accounts.activeAccounts')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.filter((acc) => acc.is_active !== false).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title={t('accounts.noAccounts')}
          description={t('accounts.noAccountsDesc')}
          action={{
            label: t('accounts.createAccount'),
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
                subtitle={`${account.currency} ${t('dashboard.account')}`}
                headerIcon={<Wallet className="h-5 w-5" />}
                status={getBalanceStatus(account)}
                metadata={[
                  {
                    label: t('accounts.currentBalance'),
                    value: (
                      <span className={`font-bold ${getBalanceColor(balance)}`}>
                        <CurrencyText value={balance} currency={account.currency as any} />
                      </span>
                    ),
                    highlight: true,
                  },
                  {
                    label: t('accounts.initialBalance'),
                    value: <CurrencyText value={initialBalance} currency={account.currency as any} />,
                  },
                  {
                    label: t('accounts.change'),
                    value: (
                      <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        <NumberText value={change} showSign /> (<PercentageText value={changePercentage} decimals={1} />)
                      </span>
                    ),
                  },
                ]}
                actions={{
                  onEdit: () => setEditingAccount(account),
                  onDelete: () => handleDelete(account),
                  customActions: [
                    {
                      label: t('accounts.viewTransactions'),
                      icon: <TrendingUp size={16} />,
                      onClick: () => {
                        // Navigate to transactions page with account filter
                        navigate(`/transactions?account_id=${account.id}`);
                      },
                    },
                  ],
                }}
                className={deletingAccountId === account.id ? 'opacity-50 pointer-events-none' : ''}
                isLoading={deletingAccountId === account.id}
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
        title={t('accounts.createAccount')}
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
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="account-form"
              isLoading={isCreating}
            >
              {t('accounts.createAccount')}
            </Button>
          </ModalFooter>
        }
      >
        <AccountForm
          onSubmit={handleCreate}
          isLoading={isCreating}
          error={createError ? t('accounts.errors.createFailed') : undefined}
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
          title={t('accounts.editAccount')}
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
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="account-form"
                isLoading={isUpdating}
              >
                {t('common.saveChanges')}
              </Button>
            </ModalFooter>
          }
        >
          <AccountForm
            account={editingAccount}
            onSubmit={handleUpdate}
            isLoading={isUpdating}
            error={updateError ? t('accounts.errors.updateFailed') : undefined}
            onClearError={resetUpdate}
          />
        </Modal>
      )}
    </div>
  );
};
