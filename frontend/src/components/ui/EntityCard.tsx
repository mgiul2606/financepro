// src/components/ui/EntityCard.tsx
import type { ReactNode, MouseEvent } from 'react';
import { Edit, Trash2, MoreVertical, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useState, useRef, useEffect } from 'react';

export interface EntityCardAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

export interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Array<{
    label: string;
    value: string | number | ReactNode;
    className?: string;
    highlight?: boolean;
  }>;
  actions?: {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: EntityCardAction[];
    showMoreMenu?: boolean;
  };
  status?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  };
  badge?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  };
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  headerIcon?: ReactNode;
}

const statusVariants = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

const badgeVariants = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-600 text-white',
  success: 'bg-green-600 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-cyan-600 text-white'
};

// Dropdown Menu Component
const DropdownMenu = ({ 
  actions, 
  isOpen, 
  onClose 
}: { 
  actions: EntityCardAction[]; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Usa MouseEvent nativo del DOM, non React.MouseEvent
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-8 z-10 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="py-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            className={cn(
              'flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors',
              action.variant === 'danger' 
                ? 'text-red-700 hover:bg-red-50' 
                : 'text-gray-700 hover:bg-gray-100',
              action.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const EntityCard = ({
  title,
  subtitle,
  description,
  metadata,
  actions,
  status,
  badge,
  footer,
  className,
  onClick,
  selected = false,
  disabled = false,
  variant = 'default',
  headerIcon
}: EntityCardProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const isClickable = onClick && !disabled;

  const handleCardClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  const handleActionClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border transition-all',
        variant === 'compact' ? 'p-4' : variant === 'detailed' ? 'p-6' : 'p-5',
        isClickable && 'cursor-pointer hover:shadow-md',
        selected && 'ring-2 ring-blue-500 border-blue-500',
        disabled && 'opacity-60 cursor-not-allowed',
        !selected && !disabled && 'border-gray-200 hover:border-gray-300',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {headerIcon && (
              <div className="text-gray-500">
                {headerIcon}
              </div>
            )}
            <h3 className={cn(
              'font-semibold text-gray-900',
              variant === 'compact' ? 'text-base' : 'text-lg',
              'truncate'
            )}>
              {title}
            </h3>
            {badge && (
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full font-medium',
                badgeVariants[badge.variant || 'primary']
              )}>
                {badge.label}
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600 truncate">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-1 ml-2 relative">
            {actions.onEdit && (
              <button
                onClick={(e) => {
                  handleActionClick(e);
                  actions.onEdit?.();
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
            )}
            
            {actions.onDelete && (
              <button
                onClick={(e) => {
                  handleActionClick(e);
                  actions.onDelete?.();
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
            
            {actions.customActions && actions.customActions.length > 0 && (
              <>
                {actions.showMoreMenu ? (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        handleActionClick(e);
                        setShowMoreMenu(!showMoreMenu);
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="More actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <DropdownMenu
                      actions={actions.customActions}
                      isOpen={showMoreMenu}
                      onClose={() => setShowMoreMenu(false)}
                    />
                  </div>
                ) : (
                  <>
                    {actions.customActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          handleActionClick(e);
                          action.onClick();
                        }}
                        disabled={action.disabled}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          action.variant === 'danger' 
                            ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                            : action.variant === 'success'
                            ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                          action.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        title={action.label}
                      >
                        {action.icon || <ExternalLink size={16} />}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className="mb-3">
          <span className={cn(
            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
            statusVariants[status.variant]
          )}>
            {status.label}
          </span>
        </div>
      )}

      {/* Description */}
      {description && variant !== 'compact' && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className={cn(
          'space-y-2',
          variant === 'compact' ? 'mt-2' : 'mt-4'
        )}>
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className={cn(
                'text-sm font-medium',
                item.highlight ? 'text-blue-600' : 'text-gray-900',
                item.className
              )}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className={cn(
          'border-t pt-3',
          variant === 'compact' ? 'mt-3' : 'mt-4'
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

// EntityCard Grid Container
export const EntityCardGrid = ({ 
  children, 
  columns = 3,
  className 
}: { 
  children: ReactNode; 
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(
      'grid gap-4',
      columnClasses[columns],
      className
    )}>
      {children}
    </div>
  );
};

// EntityCard List Container
export const EntityCardList = ({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
};