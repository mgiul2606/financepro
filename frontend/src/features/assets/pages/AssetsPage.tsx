// features/assets/pages/AssetsPage.tsx
import { useState } from 'react';
import { PlusCircle, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';
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

// Custom components
import { CurrencyText, PercentageText } from '@/core/components/atomic';
import { useConfirm } from '@/hooks/useConfirm';
import { useCrudModal } from '@/hooks/useCrudModal';

import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '../assets.hooks';
import type { AssetResponse, AssetCreate, AssetUpdate } from '../assets.types';
import { SupportedCurrency } from '@/utils/currency';
import { AssetForm } from '../components/AssetForm';
import { ASSET_TYPE_ICONS, ASSET_TYPE_COLORS } from '../assets.constants';

export const AssetsPage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // State for deleting indicator
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // Data fetching
  const { assets, isLoading, error: loadError } = useAssets();

  // Mutations
  const { createAsset, isCreating, error: createError, reset: resetCreate } = useCreateAsset();
  const { updateAsset, isUpdating, error: updateError, reset: resetUpdate } = useUpdateAsset();
  const { deleteAsset, isDeleting } = useDeleteAsset();

  // CRUD Modal management
  const crud = useCrudModal<AssetResponse, AssetCreate, AssetUpdate>({
    useCreate: () => ({ isCreating, error: createError, reset: resetCreate }),
    useUpdate: () => ({ isUpdating, error: updateError, reset: resetUpdate }),
    useDelete: () => ({ isDeleting, error: null, reset: () => {} }),
    createFn: createAsset,
    updateFn: async (id: string, data: AssetUpdate) => {
      return await updateAsset(id, data);
    },
    deleteFn: async (id: string) => {
      setDeletingAssetId(id);
      try {
        await deleteAsset(id);
      } finally {
        setDeletingAssetId(null);
      }
    },
    confirmDelete: async (asset) => {
      return await confirm({
        title: t('assets.deleteAsset'),
        message: t('assets.deleteConfirm', { name: asset.name }),
        confirmText: t('common.delete'),
        variant: 'danger',
        confirmButtonVariant: 'destructive',
      });
    },
  });

  // Utilities
  const calculateTotalValue = () => {
    return assets.reduce((sum, asset) => sum + parseFloat(asset.currentValue), 0);
  };

  const calculateTotalGain = () => {
    return assets.reduce((sum, asset) => {
      const currentValue = parseFloat(asset.currentValue);
      const purchasePrice = asset.purchasePrice ? parseFloat(asset.purchasePrice) : currentValue;
      return sum + (currentValue - purchasePrice);
    }, 0);
  };

  const getValueColor = (gain: number) => {
    if (gain < 0) return 'text-destructive';
    if (gain > 0) return 'text-green-600';
    return 'text-muted-foreground';
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

  const totalValue = calculateTotalValue();
  const totalGain = calculateTotalGain();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('assets.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('assets.subtitle')}</p>
        </div>
        <Button
          onClick={() => crud.openCreateModal()}
          disabled={crud.isCreating}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('assets.addAsset')}
        </Button>
      </div>

      {/* Error Alert */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('assets.errors.loadFailed')}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {assets.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('assets.totalValue')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyText value={totalValue} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('assets.acrossAllAssets')}
              </p>
            </CardContent>
          </Card>

          {/* Total Gain/Loss */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('assets.totalGain')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getValueColor(totalGain)}`}>
                <CurrencyText value={totalGain} showSign />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('assets.sinceAcquisition')}
              </p>
            </CardContent>
          </Card>

          {/* Asset Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('assets.assetCount')}
              </CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('assets.totalAssets')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t('assets.noAssets')}</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              {t('assets.noAssetsDesc')}
            </p>
            <Button
              onClick={() => crud.openCreateModal()}
              className="mt-6"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('assets.addAsset')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Asset Cards Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const currentValue = parseFloat(asset.currentValue);
            const purchasePrice = asset.purchasePrice
              ? parseFloat(asset.purchasePrice)
              : currentValue;
            const gain = currentValue - purchasePrice;
            const gainPercentage = purchasePrice !== 0 ? (gain / purchasePrice) * 100 : 0;

            const Icon = ASSET_TYPE_ICONS[asset.assetType];
            const colorClass = ASSET_TYPE_COLORS[asset.assetType];

            return (
              <Card
                key={asset.id}
                className={`relative transition-all hover:shadow-lg ${
                  deletingAssetId === asset.id ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <CardDescription>
                          {t(`assets.types.${asset.assetType}`)}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={deletingAssetId === asset.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => crud.openEditModal(asset)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => crud.handleDelete(asset)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {asset.isLiquid && (
                    <Badge variant="secondary" className="w-fit mt-2">
                      {t('assets.liquid')}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />

                  {/* Current Value */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('assets.currentValue')}
                    </p>
                    <p className="text-2xl font-bold">
                      <CurrencyText
                        value={currentValue}
                        currency={asset.currency as SupportedCurrency}
                      />
                    </p>
                  </div>

                  {/* Purchase Price */}
                  {asset.purchasePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('assets.purchasePrice')}
                      </span>
                      <span className="font-medium">
                        <CurrencyText
                          value={purchasePrice}
                          currency={asset.currency as SupportedCurrency}
                        />
                      </span>
                    </div>
                  )}

                  {/* Gain/Loss */}
                  {asset.purchasePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('assets.change')}
                      </span>
                      <span className={`font-medium ${getValueColor(gain)}`}>
                        <CurrencyText value={gain} showSign currency={asset.currency as SupportedCurrency} />
                        {' '}(<PercentageText value={gainPercentage} decimals={1} />)
                      </span>
                    </div>
                  )}

                  {/* Ticker Symbol */}
                  {asset.tickerSymbol && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('assets.tickerSymbol')}
                      </span>
                      <Badge variant="outline">{asset.tickerSymbol}</Badge>
                    </div>
                  )}

                  {/* Quantity */}
                  {asset.quantity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('assets.quantity')}
                      </span>
                      <span className="font-medium">
                        {parseFloat(asset.quantity).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>

                {deletingAssetId === asset.id && (
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
            <DialogTitle>{t('assets.createAsset')}</DialogTitle>
            <DialogDescription>
              {t('assets.createAssetDesc')}
            </DialogDescription>
          </DialogHeader>

          <AssetForm
            onSubmit={crud.handleCreate}
            isLoading={crud.isCreating}
            error={crud.createError ? t('assets.errors.createFailed') : undefined}
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
              form="asset-form"
              disabled={crud.isCreating}
            >
              {crud.isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('assets.createAsset')
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
            <DialogTitle>{t('assets.editAsset')}</DialogTitle>
            <DialogDescription>
              {t('assets.editAssetDesc')}
            </DialogDescription>
          </DialogHeader>

          {crud.editingEntity && (
            <AssetForm
              asset={crud.editingEntity}
              onSubmit={crud.handleUpdate}
              isLoading={crud.isUpdating}
              error={crud.updateError ? t('assets.errors.updateFailed') : undefined}
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
              form="asset-form"
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

export default AssetsPage;
