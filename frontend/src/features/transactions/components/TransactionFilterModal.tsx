// features/transactions/components/TransactionFilterModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/core/components/atomic/Button';
import { FormField, SelectField } from '@/components/ui/FormField';

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  types?: string[];
  categories?: string[];
  merchantName?: string;
  accountId?: number;
}

interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  initialFilters?: TransactionFilters;
}

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

const CATEGORIES = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Rent', label: 'Rent / Housing' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Other', label: 'Other' },
];

export const TransactionFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: TransactionFilterModalProps) => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<TransactionFilters>(
    initialFilters || {}
  );

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleApply = () => {
    // Remove empty filters
    const cleanedFilters: TransactionFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value) && value.length === 0) return;
        cleanedFilters[key as keyof TransactionFilters] = value as any;
      }
    });
    onApply(cleanedFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleTypeToggle = (type: string) => {
    setFilters((prev) => {
      const types = prev.types || [];
      const newTypes = types.includes(type)
        ? types.filter((t) => t !== type)
        : [...types, type];
      return { ...prev, types: newTypes };
    });
  };

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => {
      const categories = prev.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter((c) => c !== category)
        : [...categories, category];
      return { ...prev, categories: newCategories };
    });
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
            {TRANSACTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeToggle(type.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filters.types?.includes(type.value)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {t(`transactions.types.${type.value}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.filters.selectCategories')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryToggle(category.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filters.categories?.includes(category.value)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
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
