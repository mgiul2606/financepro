// src/pages/Accounts.tsx
import { useState } from 'react';
import { PlusCircle, Wallet, TrendingUp } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { useConfirm, ConfirmProvider } from '../hooks/useConfirm';
import { accountService } from '../services/accountService.ts';
import type { Account, AccountCreate, AccountUpdate } from '../services/accountService.ts'
import { CreateAccountModal } from '../components/CreateAccountModal';
import { EditAccountModal } from '../components/EditAccountModalV2';
import { EntityCard, EntityCardGrid } from '../components/ui/EntityCard';
import { Alert, BannerAlert } from '../components/ui/Alert';

const AccountsContent = () => {
  const confirm = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [state, actions] = useCrud<Account, AccountCreate, AccountUpdate>({
    service: accountService,
    autoLoad: true,
    onSuccess: {
      create: () => {
        setShowCreateModal(false);
      },
      update: () => {
        setEditingAccount(null);
      },
      delete: (id) => {
        console.log(`Account ${id} deleted successfully`);
      }
    },
    onError: {
      load: (error) => {
        console.error('Failed to load accounts:', error);
      },
      delete: (error) => {
        console.error('Failed to delete account:', error);
      }
    }
  });

  const { items: accounts, loading, error, creating, updating, deleting } = state;

  const handleDelete = async (account: Account) => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      confirmButtonVariant: 'danger'
    });

    if (confirmed) {
      try {
        await actions.delete(account.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Error is already handled by onError callback
      }
    }
  };

  const handleAccountCreated = (account: Account) => {
    actions.addItem(account);
    setShowCreateModal(false);
  };

  const handleAccountUpdated = (account: Account) => {
    actions.updateItem(account.id, account);
    setEditingAccount(null);
  };

  const getBalanceStatus = (account: Account) => {
    const balance = account.current_balance;
    if (balance < 0) {
      return { label: 'Overdrawn', variant: 'error' as const };
    } else if (balance < 100) {
      return { label: 'Low Balance', variant: 'warning' as const };
    } else if (balance > 10000) {
      return { label: 'High Balance', variant: 'success' as const };
    }
    return undefined;
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-red-600';
    if (balance < 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <PlusCircle size={20} />
          New Account
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert 
          variant="error" 
          closable 
          onClose={actions.clearError}
          className="mb-6"
        >
          {error}
        </Alert>
      )}

      {/* Summary Banner */}
      {accounts.length > 0 && (
        <BannerAlert
          variant="info"
          className="mb-6"
          closable={false}
        >
          <div className="flex items-center justify-between">
            <span>
              Total accounts: {accounts.length} • 
              Total balance: {accounts.reduce((sum, acc) => sum + acc.current_balance, 0).toFixed(2)} EUR
            </span>
          </div>
        </BannerAlert>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new account.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              New Account
            </button>
          </div>
        </div>
      ) : (
        /* Account Cards */
        <EntityCardGrid columns={3}>
          {accounts.map((account) => (
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
                    <span className={`font-bold ${getBalanceColor(account.current_balance)}`}>
                      {account.currency} {account.current_balance.toFixed(2)}
                    </span>
                  ),
                  highlight: true
                },
                {
                  label: 'Initial Balance',
                  value: `${account.currency} ${account.initial_balance.toFixed(2)}`
                },
                {
                  label: 'Change',
                  value: (() => {
                    const diff = account.current_balance - account.initial_balance;
                    const percentage = account.initial_balance !== 0 
                      ? ((diff / account.initial_balance) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)} ({percentage}%)
                      </span>
                    );
                  })()
                }
              ]}
              actions={{
                onEdit: () => setEditingAccount(account),
                onDelete: () => handleDelete(account),
                customActions: [
                  {
                    label: 'View Transactions',
                    icon: <TrendingUp size={16} />,
                    onClick: () => {
                      // Navigate to transactions page with account filter
                      console.log('View transactions for account:', account.id);
                    }
                  }
                ]
              }}
              className={deleting ? 'opacity-50' : ''}
            />
          ))}
        </EntityCardGrid>
      )}

      {/* Create Modal */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleAccountCreated}
      />

      {/* Edit Modal */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          isOpen={true}
          onClose={() => setEditingAccount(null)}
          onUpdated={handleAccountUpdated}
        />
      )}
    </div>
  );
};

// Wrap with ConfirmProvider
export const Accounts = () => {
  return (
    <ConfirmProvider>
      <AccountsContent />
    </ConfirmProvider>
  );
};
