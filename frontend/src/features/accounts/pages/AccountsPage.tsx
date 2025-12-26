// features/accounts/pages/AccountsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Custom components (kept minimal)
import { CurrencyText, NumberText, PercentageText } from '@/core/components/atomic';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

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

  // State for deleting indicator (temporary, could be moved to useCrudModal if needed)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Data fetching
  const { accounts, isLoading, error: loadError } = useAccounts();

  // Mutations
  const { createAccount, isCreating, error: createError, reset: resetCreate } = useCreateAccount();
  const { updateAccount, isUpdating, error: updateError, reset: resetUpdate } = useUpdateAccount();
  const { deleteAccount, isDeleting } = useDeleteAccount();

  // CRUD Modal management
  const crud = useCrudModal<AccountResponse, AccountCreate, AccountUpdate>({
    useCreate: () => ({ isCreating, error: createError, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: createAccount,
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
    if (balance < 0) return 'text-destructive';
    if (balance < 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  };

  // Loading state with Skeleton
  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('accounts.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('accounts.subtitle')}</p>
        </div>
        <Button
          onClick={() => crud.openCreateModal()}
          disabled={crud.isCreating}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('accounts.newAccount')}
        </Button>
      </div>

      {/* Error Alert */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('accounts.errors.loadFailed')}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {accounts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('accounts.totalAccounts')}
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('accounts.activeAccounts')}: {accounts.filter((acc) => acc.isActive !== false).length}
              </p>
            </CardContent>
          </Card>

          {/* Total Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('accounts.totalBalance')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyText value={calculateTotalBalance()} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('accounts.acrossAllAccounts', 'Across all accounts')}
              </p>
            </CardContent>
          </Card>

          {/* Average Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('accounts.averageBalance', 'Average Balance')}
              </CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyText 
                  value={accounts.length > 0 ? calculateTotalBalance() / accounts.length : 0} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('accounts.perAccount', 'Per account')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t('accounts.noAccounts')}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              {t('accounts.noAccountsDesc')}
            </p>
            <Button
              onClick={() => crud.openCreateModal()}
              className="mt-6"
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
                className={`relative transition-all hover:shadow-lg ${
                  deletingAccountId === account.id ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>
                          {account.currency} {t('dashboard.account')}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={deletingAccountId === account.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => crud.openEditModal(account)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/transactions?account_id=${account.id}`)}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          {t('accounts.viewTransactions')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => crud.handleDelete(account)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {balanceStatus && (
                    <Badge variant={balanceStatus.variant} className="w-fit mt-2">
                      {balanceStatus.label}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  
                  {/* Current Balance */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('accounts.currentBalance')}
                    </p>
                    <p className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                      <CurrencyText value={balance} currency={account.currency as SupportedCurrency} />
                    </p>
                  </div>

                  {/* Initial Balance */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('accounts.initialBalance')}
                    </span>
                    <span className="font-medium">
                      <CurrencyText value={initialBalance} currency={account.currency as SupportedCurrency} />
                    </span>
                  </div>

                  {/* Change */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('accounts.change')}
                    </span>
                    <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <NumberText value={change} showSign /> 
                      {' '}(<PercentageText value={changePercentage} decimals={1} />)
                    </span>
                  </div>
                </CardContent>

                {deletingAccountId === account.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm font-medium">{t('common.deleting')}</span>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('accounts.createAccount')}</DialogTitle>
            <DialogDescription>
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
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={crud.isCreating}
            >
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('accounts.editAccount')}</DialogTitle>
            <DialogDescription>
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
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={crud.isUpdating}
            >
              {crud.isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
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
