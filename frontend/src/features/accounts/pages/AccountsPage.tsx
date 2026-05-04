// features/accounts/pages/AccountsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet, TrendingUp, MoreVertical, Edit, Trash2, RefreshCw, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Custom components (kept minimal)
import { CurrencyText, PercentageText } from '@/core/components/atomic';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

import { useProfileContext } from '@/contexts/ProfileContext';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '../accounts.hooks';
import type { AccountResponse, AccountCreate, AccountUpdate } from '@/api/generated/models';
import { SupportedCurrency } from '@/utils/currency';
import { AccountForm } from '..';

// Types
type BalanceStatus = {
  status: 'overdrawn' | 'low' | 'high' | 'normal';
  label: string;
  variant: 'destructive' | 'secondary' | 'default' | 'outline' | null | undefined;
};

export const AccountsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { mainProfileId } = useProfileContext();

  // State for deleting indicator (temporary, could be moved to useCrudModal if needed)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Data fetching
  const { accounts, isLoading, error: loadError, refetch } = useAccounts();

  // Mutations
  const { createAccount, isCreating, error: createError, reset: resetCreate } = useCreateAccount();
  const { updateAccount, isUpdating, error: updateError, reset: resetUpdate } = useUpdateAccount();
  const { deleteAccount, isDeleting } = useDeleteAccount();

  // CRUD Modal management
  const crud = useCrudModal<AccountResponse, AccountCreate, AccountUpdate>({
    useCreate: () => ({ isCreating, error: createError, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: (data: AccountCreate) =>
      createAccount({ ...data, financialProfileId: data.financialProfileId || mainProfileId || '' }),
    updateFn: updateAccount,
    deleteFn: async (id: string) => {
      setDeletingAccountId(id);
      try {
        await deleteAccount(id);
      } finally {
        setDeletingAccountId(null);
      }
    },
    confirmDelete: async (account) => {
      return await confirm({
        title: t('accounts.deleteAccount'),
        message: t('accounts.deleteConfirm', { name: account.name }),
        confirmText: t('common.delete'),
        variant: 'danger',
        confirmButtonVariant: 'destructive',
      });
    },
  });

  // Utilities
  const getBalanceStatus = (account: AccountResponse): BalanceStatus | undefined => {
    const balance = parseFloat(account.currentBalance);

    if (balance < 0) {
      return {
        status: 'overdrawn',
        label: t('accounts.status.overdrawn'),
        variant: 'destructive'
      };
    } else if (balance < 100) {
      return {
        status: 'low',
        label: t('accounts.status.lowBalance'),
        variant: 'secondary'
      };
    } else if (balance > 10000) {
      return {
        status: 'high',
        label: t('accounts.status.highBalance'),
        variant: 'outline'
      };
    }

    return undefined;
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-rose-600';
    if (balance < 100) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  };

  // Loading state with Skeleton
  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-gray-50 min-h-full">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm border border-gray-100">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-28" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm border border-gray-100">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('accounts.title')}</h1>
          <p className="text-gray-500 mt-1">{t('accounts.subtitle')}</p>
        </div>
        <Button
          onClick={() => crud.openCreateModal()}
          disabled={crud.isCreating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('accounts.newAccount')}
        </Button>
      </div>

      {/* Error Alert */}
      {loadError && (
        <Alert className="border-rose-200 bg-rose-50 text-rose-800">
          <div className="flex items-center justify-between">
            <div>
              <AlertTitle className="text-rose-800 font-semibold">{t('common.error')}</AlertTitle>
              <AlertDescription className="text-rose-700">{t('accounts.errors.loadFailed')}</AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-rose-300 text-rose-700 hover:bg-rose-100">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </Alert>
      )}

      {/* Summary Cards */}
      {accounts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Accounts */}
          <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('accounts.totalAccounts')}
              </p>
              <span className="bg-indigo-50 text-indigo-600 rounded-lg p-2">
                <Wallet className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{accounts.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('accounts.activeAccounts')}: {accounts.filter((acc) => acc.isActive !== false).length}
              </p>
            </CardContent>
          </Card>

          {/* Total Balance */}
          <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('accounts.totalBalance')}
              </p>
              <span className="bg-emerald-50 text-emerald-600 rounded-lg p-2">
                <TrendingUp className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                <CurrencyText value={calculateTotalBalance()} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('accounts.acrossAllAccounts', 'Across all accounts')}
              </p>
            </CardContent>
          </Card>

          {/* Average Balance */}
          <Card className="rounded-xl shadow-sm border border-gray-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('accounts.averageBalance', 'Average Balance')}
              </p>
              <span className="bg-violet-50 text-violet-600 rounded-lg p-2">
                <BarChart3 className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                <CurrencyText
                  value={accounts.length > 0 ? calculateTotalBalance() / accounts.length : 0}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('accounts.perAccount', 'Per account')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <Card className="rounded-xl border-2 border-dashed border-gray-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
              <Wallet className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-900">{t('accounts.noAccounts')}</h3>
            <p className="mt-2 text-center text-sm text-gray-500 max-w-sm">
              {t('accounts.noAccountsDesc')}
            </p>
            <Button
              onClick={() => crud.openCreateModal()}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('accounts.createAccount')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Account Cards Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const balance = parseFloat(account.currentBalance);
            const initialBalance = parseFloat(account.initialBalance);
            const change = balance - initialBalance;
            const changePercentage =
              initialBalance !== 0 ? (change / initialBalance) * 100 : 0;
            const balanceStatus = getBalanceStatus(account);

            return (
              <Card
                key={account.id}
                className={`relative rounded-xl shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow ${
                  deletingAccountId === account.id ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 rounded-lg p-2.5">
                        <Wallet className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">{account.name}</CardTitle>
                        <CardDescription className="text-xs text-gray-400 mt-0.5">
                          {account.currency} {t('dashboard.account')}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          disabled={deletingAccountId === account.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-lg border border-gray-100">
                        <DropdownMenuItem onClick={() => crud.openEditModal(account)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/transactions?account_id=${account.id}`)}
                          className="cursor-pointer"
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          {t('accounts.viewTransactions')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => crud.handleDelete(account)}
                          className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status badge */}
                  {balanceStatus && (
                    <div className="mt-2">
                      {balanceStatus.status === 'overdrawn' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          {balanceStatus.label}
                        </span>
                      )}
                      {balanceStatus.status === 'low' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {balanceStatus.label}
                        </span>
                      )}
                      {balanceStatus.status === 'high' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {balanceStatus.label}
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <Separator className="bg-gray-100" />

                  {/* Current Balance */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t('accounts.currentBalance')}
                    </p>
                    <p className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                      <CurrencyText value={balance} currency={account.currency as SupportedCurrency} />
                    </p>
                  </div>

                  {/* Initial Balance */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {t('accounts.initialBalance')}
                    </span>
                    <span className="font-medium text-gray-700">
                      <CurrencyText value={initialBalance} currency={account.currency as SupportedCurrency} />
                    </span>
                  </div>

                  {/* Change */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {t('accounts.change')}
                    </span>
                    <span className={`font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <CurrencyText value={change} showSign />
                      {' '}(<PercentageText value={changePercentage} decimals={1} />)
                    </span>
                  </div>
                </CardContent>

                {deletingAccountId === account.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span className="text-sm font-medium text-gray-700">{t('common.deleting')}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={crud.showCreateModal} onOpenChange={(open) => {
        if (!crud.isCreating) {
          if (!open) {
            crud.closeCreateModal();
          } else {
            crud.setShowCreateModal(open);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('accounts.createAccount')}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('accounts.createAccountDesc', 'Create a new account to track your finances.')}
            </DialogDescription>
          </DialogHeader>

          <AccountForm
            onSubmit={crud.handleCreate}
            isLoading={crud.isCreating}
            error={crud.createError ? t('accounts.errors.createFailed') : undefined}
            onClearError={crud.resetCreate}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => crud.closeCreateModal()}
              disabled={crud.isCreating}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={crud.isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('accounts.createAccount')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!crud.editingEntity} onOpenChange={(open) => {
        if (!crud.isUpdating) {
          if (!open) {
            crud.closeEditModal();
          }
        }
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('accounts.editAccount')}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('accounts.editAccountDesc', 'Update account information and settings.')}
            </DialogDescription>
          </DialogHeader>

          {crud.editingEntity && (
            <AccountForm
              account={crud.editingEntity}
              onSubmit={crud.handleUpdate}
              isLoading={crud.isUpdating}
              error={crud.updateError ? t('accounts.errors.updateFailed') : undefined}
              onClearError={crud.resetUpdate}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => crud.closeEditModal()}
              disabled={crud.isUpdating}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={crud.isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {crud.isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
