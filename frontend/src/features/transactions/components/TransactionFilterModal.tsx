// features/transactions/components/TransactionFilterModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/core/components/atomic/Button';
import { FormField } from '@/components/ui/FormField';
import { toggleArrayField } from '@/utils/toggleArrayField';
import { removeEmptyFilters } from '@/utils/filters';
import { TransactionType } from '@/api/generated/models';
import { useCategories } from '@/features/categories';

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  types?: string[];
  categories?: string[];
  merchantName?: string;
  accountId?: string;
  allowedAccounts?: string[];
}

interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  initialFilters?: TransactionFilters;
}

export const TransactionFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: TransactionFilterModalProps) => {
  const { t } = useTranslation();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [filters, setFilters] = useState<TransactionFilters>(
    initialFilters || {}
  );

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
    onApply(removeEmptyFilters(filters));
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.filters.title')}
      size="md"
      footer={
        <ModalFooter>
          <Button variant="ghost" onClick={handleReset}>
            {t('transactions.filters.reset')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleApply} leftIcon={<Filter />}>
            {t('transactions.filters.apply')}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.filters.dateRange')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t('transactions.filters.from')}
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
            />
            <FormField
              label={t('transactions.filters.to')}
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
            />
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.amount')} Range
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t('transactions.filters.minAmount')}
              type="number"
              step="0.01"
              value={filters.minAmount || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="0.00"
            />
            <FormField
              label={t('transactions.filters.maxAmount')}
              type="number"
              step="0.01"
              value={filters.maxAmount || ''}
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

        {/* Transaction Types */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.filters.selectTypes')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFilters(toggleArrayField(filters, "types", type.value))}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filters.types?.includes(type.value)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.filters.selectCategories')}
          </h4>
          {categoriesLoading ? (
            <div className="text-sm text-neutral-500">Loading categories...</div>
          ) : categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFilters(toggleArrayField(filters, "categories", category.id))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.categories?.includes(category.id)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">{t('transactions.filters.noCategories')}</div>
          )}
        </div>

        {/* Merchant Name */}
        <div className="space-y-2">
          <FormField
            label={t('transactions.filters.merchantName')}
            value={filters.merchantName || ''}
            onChange={(e) =>
              setFilters({ ...filters, merchantName: e.target.value })
            }
            placeholder={t('transactions.merchantPlaceholder')}
          />
        </div>
      </div>
    </Modal>
  );
};
