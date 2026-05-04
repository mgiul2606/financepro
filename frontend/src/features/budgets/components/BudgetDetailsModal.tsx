// features/budgets/components/BudgetDetailsModal.tsx
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyText } from '@/core/components/formatters';
import { EmptyState } from '@/core/components/composite/EmptyState';
import { Spinner } from '@/core/components/atomic/Spinner';
import type { Budget } from '../budgets.types';
import { useBudgetDetail } from '../budgets.hooks';
import { useCategories, useCategoryName } from '@/features/categories';
import { getProgressBarClass } from '@/lib/finance-colors';

interface BudgetDetailsModalProps {
  budget: Budget;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetDetailsModal = ({
  budget,
  isOpen,
  onClose,
}: BudgetDetailsModalProps) => {
  const { t } = useTranslation();
  const [periodOffset, setPeriodOffset] = useState(0);

  const { data: detail, isLoading } = useBudgetDetail(
    isOpen ? budget.id : null,
    periodOffset
  );
  const { categories: userCategories } = useCategories();
  const getCategoryName = useCategoryName();
  const categoriesById = Object.fromEntries(userCategories.map((c) => [c.id, c]));

  const handlePrevious = useCallback(() => {
    setPeriodOffset((prev) => prev - 1);
  }, []);

  const handleNext = useCallback(() => {
    setPeriodOffset((prev) => prev + 1);
  }, []);

  const handleGoToCurrent = useCallback(() => {
    setPeriodOffset(0);
  }, []);

  const handleClose = useCallback(() => {
    setPeriodOffset(0);
    onClose();
  }, [onClose]);

  const isCustom = budget.periodType === 'custom';

  // Use server data when available, fall back to budget list data
  const totalAmount = detail
    ? parseFloat(detail.spending.totalAllocated)
    : parseFloat(budget.totalAmount);
  const totalSpent = detail
    ? parseFloat(detail.spending.totalSpent)
    : parseFloat(budget.totalSpent ?? '0');
  const remaining = totalAmount - totalSpent;
  const percentage = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;

  const periodInfo = detail?.period;
  const categories = detail?.spending.categories ?? [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('budgets.budgetDetails')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Budget Overview */}
          <Card variant="bordered" className="bg-linear-to-r from-blue-50 to-purple-50">
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{budget.name}</h3>
                  {categories.length > 0 && (
                    <p className="text-sm text-neutral-600 mt-1">
                      {categories.length} {categories.length === 1 ? t('budgets.category') : t('budgets.categoryAllocations').toLowerCase()}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    percentage >= 100
                      ? 'destructive'
                      : percentage >= 80
                        ? 'warning'
                        : 'success'
                  }
                  size="sm"
                >
                  {percentage.toFixed(0)}%
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-600">{t('budgets.spent')}</span>
                  <CurrencyText value={totalSpent.toString()} className="font-semibold" />
                </div>
                <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressBarClass(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Budget Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">{t('budgets.amount')}</p>
                  <CurrencyText
                    value={totalAmount.toString()}
                    className="text-lg font-bold text-neutral-900"
                  />
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">{t('budgets.spent')}</p>
                  <CurrencyText
                    value={totalSpent.toString()}
                    className="text-lg font-bold text-red-600"
                  />
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">{t('budgets.remaining')}</p>
                  <CurrencyText
                    value={remaining.toString()}
                    className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  />
                </div>
              </div>

              {/* Period Navigation */}
              {periodInfo && (
                <div className="mt-4">
                  {!isCustom ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={!periodInfo.hasPrevious || isLoading}
                        aria-label={t('budgets.previousPeriod')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        <span className="font-medium">
                          {format(new Date(periodInfo.start), 'dd MMM yyyy')}
                          {' - '}
                          {format(new Date(periodInfo.end), 'dd MMM yyyy')}
                        </span>
                        {!periodInfo.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGoToCurrent}
                            disabled={isLoading}
                            className="ml-1 text-blue-600 hover:text-blue-700"
                            aria-label={t('budgets.currentPeriod')}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNext}
                        disabled={!periodInfo.hasNext || isLoading}
                        aria-label={t('budgets.nextPeriod')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(periodInfo.start), 'dd MMM yyyy')}
                        {' - '}
                        {format(new Date(periodInfo.end), 'dd MMM yyyy')}
                      </span>
                      <span className="mx-2">&bull;</span>
                      <span className="capitalize">{t(`budgets.periods.${budget.periodType}`)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Category Breakdown */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<TrendingDown />}
              title={t('budgets.noTransactionsInBudget')}
              description={t('budgets.noCategoryAllocations')}
            />
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                {t('budgets.categoryAllocations')}
              </h4>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const catAllocated = parseFloat(cat.allocated);
                  const catSpent = parseFloat(cat.spent);
                  const catRemaining = parseFloat(cat.remaining);
                  const catPercent = catAllocated > 0 ? (catSpent / catAllocated) * 100 : 0;

                  return (
                    <div
                      key={cat.categoryId}
                      className="p-3 bg-white rounded-lg border border-neutral-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {categoriesById[cat.categoryId]
                            ? getCategoryName(categoriesById[cat.categoryId])
                            : cat.categoryName}
                        </span>
                        <Badge
                          variant={
                            catPercent >= 100
                              ? 'destructive'
                              : catPercent >= 80
                                ? 'warning'
                                : 'success'
                          }
                          size="sm"
                        >
                          {catPercent.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-300 ${getProgressBarClass(catPercent)}`}
                          style={{ width: `${Math.min(catPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-600">
                        <span>
                          <CurrencyText value={catSpent.toString()} /> / <CurrencyText value={catAllocated.toString()} />
                        </span>
                        <span className={catRemaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {t('budgets.remaining')}: <CurrencyText value={catRemaining.toString()} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {categories.length > 0 && (
            <Card variant="bordered" className="bg-neutral-50">
              <CardBody className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">{t('budgets.categoryAllocations')}</span>
                    <span className="font-semibold text-neutral-900">
                      {categories.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">{t('budgets.spent')}</span>
                    <CurrencyText
                      value={totalSpent.toString()}
                      className="font-semibold text-neutral-900"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
