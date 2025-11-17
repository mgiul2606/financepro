// features/analytic/components/AnalyticsFilterModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/core/components/atomic/Button';
import { FormField } from '@/components/ui/FormField';

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
}

interface AnalyticsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AnalyticsFilters) => void;
  initialFilters: AnalyticsFilters;
}

const CATEGORIES = [
  'Salary', 'Groceries', 'Rent', 'Transport', 'Entertainment',
  'Healthcare', 'Shopping', 'Utilities', 'Other'
];

export const AnalyticsFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: AnalyticsFilterModalProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: AnalyticsFilters = {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    };
    setFilters(defaultFilters);
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
      title={t('analytics.filters')}
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
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <FormField
              label={t('transactions.filters.to')}
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            Amount Range
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

        {/* Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-neutral-700">
            {t('transactions.filters.selectCategories')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filters.categories?.includes(category)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
