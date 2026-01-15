// features/transactions/components/TransactionFilterModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Utils
import { toggleArrayField } from '@/utils/toggleArrayField';
import { removeEmptyFilters } from '@/utils/filters';
import { TransactionType } from '@/api/generated/models';
import { useCategories } from '@/features/categories';

// Types - using the unified type from transactions.types
import type { TransactionUIFilters } from '../transactions.types';

interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: TransactionUIFilters) => void;
  initialFilters?: TransactionUIFilters;
}

export const TransactionFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: TransactionFilterModalProps) => {
  const { t } = useTranslation();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [filters, setFilters] = useState<TransactionUIFilters>(initialFilters || {});

  // Generate transaction types from backend enum
  const transactionTypes = Object.keys(TransactionType).map((key) => ({
    value: TransactionType[key as keyof typeof TransactionType],
    label: t(`transactions.types.${TransactionType[key as keyof typeof TransactionType]}`),
  }));

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleApply = () => {
    onApply(removeEmptyFilters(filters) as TransactionUIFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('transactions.filters.title')}</DialogTitle>
          <DialogDescription>
            {t('transactions.filters.description', 'Filter transactions by various criteria')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t('transactions.filters.dateRange')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">{t('transactions.filters.from')}</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">{t('transactions.filters.to')}</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t('transactions.amount')} Range
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minAmount">{t('transactions.filters.minAmount')}</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  value={filters.minAmount ?? ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">{t('transactions.filters.maxAmount')}</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  value={filters.maxAmount ?? ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Transaction Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t('transactions.filters.selectTypes')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFilters(toggleArrayField(filters, 'types', type.value))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.types?.includes(type.value)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t('transactions.filters.selectCategories')}
            </h4>
            {categoriesLoading ? (
              <div className="text-sm text-muted-foreground">Loading categories...</div>
            ) : categories && categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setFilters(toggleArrayField(filters, 'categories', category.id))
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.categories?.includes(category.id)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('transactions.filters.noCategories')}
              </div>
            )}
          </div>

          {/* Merchant Name */}
          <div className="space-y-2">
            <Label htmlFor="merchantName">{t('transactions.filters.merchantName')}</Label>
            <Input
              id="merchantName"
              value={filters.merchantName || ''}
              onChange={(e) => setFilters({ ...filters, merchantName: e.target.value })}
              placeholder={t('transactions.merchantPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleReset}>
            {t('transactions.filters.reset')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleApply}>
            <Filter className="mr-2 h-4 w-4" />
            {t('transactions.filters.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
