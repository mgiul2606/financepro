// features/goals/components/GoalForm.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Goal, GoalCreate, GoalUpdate, GoalPriority } from '../goals.types';
import {
  GOAL_PRIORITY_OPTIONS,
  GOAL_CATEGORY_OPTIONS,
  CURRENCY_OPTIONS,
} from '../goals.constants';

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: GoalCreate | GoalUpdate) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

export const GoalForm = ({
  goal,
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: GoalFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!goal;

  const [formData, setFormData] = useState<GoalCreate>({
    name: goal?.name || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount || 0,
    currency: goal?.currency || 'EUR',
    targetDate: goal?.targetDate || '',
    priority: (goal?.priority) || 'medium',
    category: goal?.category || 'Savings',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        targetDate: goal.targetDate,
        priority: goal.priority,
        category: goal.category || 'Savings',
      });
    }
  }, [goal]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return t('goals.errors.nameRequired');
        }
        if (value.length > 100) {
          return t('goals.errors.nameTooLong');
        }
        break;
      case 'targetAmount':
        if (!value || value <= 0) {
          return t('goals.errors.targetAmountPositive');
        }
        break;
      case 'targetDate':
        if (!value) {
          return t('goals.errors.targetDateRequired');
        }
        break;
    }
    return '';
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof GoalCreate]);
      if (error) {
        errors[key] = error;
      }
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const progressPercentage = goal
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {onClearError && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="h-auto p-0 hover:bg-transparent"
              >
                ✕
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Goal Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          {t('goals.name')}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder={t('goals.namePlaceholder')}
          disabled={isLoading}
          className={fieldErrors.name ? 'border-destructive' : ''}
        />
        {fieldErrors.name && (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('goals.descriptionLabel')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder={t('goals.descriptionPlaceholder')}
          disabled={isLoading}
          rows={3}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">{t('goals.descriptionHint')}</p>
      </div>

      {/* Target Amount and Currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetAmount" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('goals.targetAmount')}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.targetAmount || ''}
            onChange={(e) =>
              handleFieldChange('targetAmount', parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            disabled={isLoading}
            className={fieldErrors.targetAmount ? 'border-destructive' : ''}
          />
          {fieldErrors.targetAmount && (
            <p className="text-sm text-destructive">{fieldErrors.targetAmount}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">
            {t('accounts.currency')}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => handleFieldChange('currency', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Target Date */}
      <div className="space-y-2">
        <Label htmlFor="targetDate" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('goals.targetDate')}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="targetDate"
          type="date"
          value={formData.targetDate}
          onChange={(e) => handleFieldChange('targetDate', e.target.value)}
          disabled={isLoading}
          className={fieldErrors.targetDate ? 'border-destructive' : ''}
        />
        {fieldErrors.targetDate ? (
          <p className="text-sm text-destructive">{fieldErrors.targetDate}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('goals.targetDateHint')}</p>
        )}
      </div>

      {/* Priority and Category */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('goals.priority')}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              handleFieldChange('priority', value as GoalPriority)
            }
            disabled={isLoading}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{t('goals.priorityHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('transactions.category')}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleFieldChange('category', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Card (Edit Mode) */}
      {isEditMode && goal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              {t('goals.currentProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('goals.saved')}</span>
                <span className="font-medium">
                  {goal.currency} {goal.currentAmount.toFixed(2)} / {goal.targetAmount.toFixed(2)}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progressPercentage.toFixed(1)}%</span>
                <span>
                  {t('budgets.remaining')}: {goal.currency}{' '}
                  {(goal.targetAmount - goal.currentAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">{t('budgets.status')}</p>
                <p className="text-sm font-medium capitalize">
                  {goal.status.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('goals.priority')}</p>
                <p className="text-sm font-medium capitalize">{goal.priority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
};