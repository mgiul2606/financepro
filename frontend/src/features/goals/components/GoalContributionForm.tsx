// features/goals/components/GoalContributionForm.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoalContributionFormProps {
  onSubmit: (data: {
    amount: number;
    contributionDate: string;
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

export const GoalContributionForm = ({
  onSubmit,
  isLoading = false,
  error,
  onClearError,
}: GoalContributionFormProps) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setValidationError(t('goals.contribution.amountRequired'));
      return;
    }
    if (!contributionDate) {
      setValidationError(t('goals.contribution.dateRequired'));
      return;
    }

    await onSubmit({
      amount: numAmount,
      contributionDate,
      notes: notes || undefined,
    });
  };

  return (
    <form id="contribution-form" onSubmit={handleSubmit} className="space-y-4">
      {(error || validationError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {validationError || error}
            {onClearError && error && (
              <button
                type="button"
                className="ml-2 underline text-xs"
                onClick={onClearError}
              >
                {t('common.dismiss')}
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="contribution-amount" className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          {t('goals.contribution.amount')}
        </Label>
        <Input
          id="contribution-amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="contribution-date" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {t('goals.contribution.date')}
        </Label>
        <Input
          id="contribution-date"
          type="date"
          value={contributionDate}
          onChange={(e) => setContributionDate(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="contribution-notes">{t('goals.contribution.notes')}</Label>
        <Textarea
          id="contribution-notes"
          placeholder={t('goals.contribution.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('goals.contribution.add')}
        </Button>
      </div>
    </form>
  );
};
