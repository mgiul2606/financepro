import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '../atomic/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-neutral-400 [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>

      {description && (
        <p className="text-neutral-600 max-w-md mb-6">{description}</p>
      )}

      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
