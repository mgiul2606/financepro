// src/components/ui/Alert.tsx
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  X, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  XCircle,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'default';
  title?: string;
  children: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  icon?: ReactNode | boolean;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: number; // milliseconds
  persist?: boolean;
}

const alertVariants = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="h-5 w-5 text-blue-400" />,
    title: 'text-blue-800',
    content: 'text-blue-700',
    closeButton: 'text-blue-500 hover:text-blue-700',
    action: 'text-blue-600 hover:text-blue-800'
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    title: 'text-green-800',
    content: 'text-green-700',
    closeButton: 'text-green-500 hover:text-green-700',
    action: 'text-green-600 hover:text-green-800'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    title: 'text-yellow-800',
    content: 'text-yellow-700',
    closeButton: 'text-yellow-500 hover:text-yellow-700',
    action: 'text-yellow-600 hover:text-yellow-800'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle className="h-5 w-5 text-red-400" />,
    title: 'text-red-800',
    content: 'text-red-700',
    closeButton: 'text-red-500 hover:text-red-700',
    action: 'text-red-600 hover:text-red-800'
  },
  default: {
    container: 'bg-gray-50 border-gray-200 text-gray-800',
    icon: <Bell className="h-5 w-5 text-gray-400" />,
    title: 'text-gray-800',
    content: 'text-gray-700',
    closeButton: 'text-gray-500 hover:text-gray-700',
    action: 'text-gray-600 hover:text-gray-800'
  }
};

export const Alert = ({
  variant = 'default',
  title,
  children,
  closable = false,
  onClose,
  icon = true,
  className,
  action,
  autoClose,
  persist = false
}: AlertProps) => {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const variantStyles = alertVariants[variant];

  useEffect(() => {
    if (autoClose && !persist) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, persist]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 200); // Match animation duration
  };

  if (!visible) return null;

  // Determine icon to show
  const iconToRender = icon === true ? variantStyles.icon : icon === false ? null : icon;

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-all duration-200',
        variantStyles.container,
        isClosing && 'opacity-0 transform scale-95',
        className
      )}
      role="alert"
    >
      <div className="flex">
        {iconToRender && (
          <div className="flex-shrink-0">
            {iconToRender}
          </div>
        )}
        
        <div className={cn('flex-1', iconToRender && 'ml-3')}>
          {title && (
            <h3 className={cn('text-sm font-medium mb-1', variantStyles.title)}>
              {title}
            </h3>
          )}
          
          <div className={cn('text-sm', variantStyles.content)}>
            {children}
          </div>
          
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={cn(
                  'text-sm font-medium underline transition-colors',
                  variantStyles.action
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        {closable && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                variantStyles.closeButton,
                variant === 'info' && 'focus:ring-blue-500',
                variant === 'success' && 'focus:ring-green-500',
                variant === 'warning' && 'focus:ring-yellow-500',
                variant === 'error' && 'focus:ring-red-500',
                variant === 'default' && 'focus:ring-gray-500'
              )}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Alert List Component for stacked alerts
export const AlertList = ({ 
  alerts,
  className 
}: { 
  alerts: Array<AlertProps & { id: string | number }>;
  className?: string;
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {alerts.map((alert) => (
        <Alert key={alert.id} {...alert} />
      ))}
    </div>
  );
};

// Toast-style Alert Component
export const ToastAlert = ({
  variant = 'default',
  title,
  children,
  onClose,
  icon = true,
  autoClose = 5000,
  position = 'top-right',
  ...props
}: AlertProps & {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}) => {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className={cn(
      'fixed z-50 transition-all duration-200',
      positionClasses[position],
      isClosing && 'opacity-0 transform translate-y-2'
    )}>
      <Alert
        {...props}
        variant={variant}
        title={title}
        icon={icon}
        closable
        onClose={handleClose}
        className="shadow-lg min-w-[300px] max-w-md"
      >
        {children}
      </Alert>
    </div>
  );
};

// Inline Alert for forms
export const InlineAlert = ({
  variant = 'error',
  children,
  className,
  icon = true
}: Pick<AlertProps, 'variant' | 'children' | 'className' | 'icon'>) => {
  const variantStyles = alertVariants[variant];
  const iconToRender = icon === true ? variantStyles.icon : icon === false ? null : icon;

  return (
    <div className={cn(
      'flex items-start gap-2 text-sm py-2',
      className
    )}>
      {iconToRender && (
        <div className="flex-shrink-0 mt-0.5">
          {React.cloneElement(iconToRender as React.ReactElement, {
            className: cn('h-4 w-4', (iconToRender as React.ReactElement).props.className)
          })}
        </div>
      )}
      <div className={variantStyles.content}>
        {children}
      </div>
    </div>
  );
};

// Banner Alert (full width, typically at top of page)
export const BannerAlert = ({
  variant = 'info',
  title,
  children,
  closable = true,
  onClose,
  action,
  className,
  icon = true
}: AlertProps) => {
  const [visible, setVisible] = useState(true);
  const variantStyles = alertVariants[variant];

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  const iconToRender = icon === true ? variantStyles.icon : icon === false ? null : icon;

  return (
    <div className={cn(
      'w-full border-b',
      variantStyles.container,
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              {iconToRender && (
                <span className="flex p-2">
                  {iconToRender}
                </span>
              )}
              <div className={cn('ml-3 font-medium', variantStyles.content)}>
                {title && <span className="font-semibold mr-2">{title}</span>}
                <span>{children}</span>
              </div>
            </div>
            
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              {action && (
                <button
                  onClick={action.onClick}
                  className={cn(
                    'flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
                    variant === 'info' && 'bg-blue-600 hover:bg-blue-700',
                    variant === 'success' && 'bg-green-600 hover:bg-green-700',
                    variant === 'warning' && 'bg-yellow-600 hover:bg-yellow-700',
                    variant === 'error' && 'bg-red-600 hover:bg-red-700',
                    variant === 'default' && 'bg-gray-600 hover:bg-gray-700'
                  )}
                >
                  {action.label}
                </button>
              )}
            </div>
            
            {closable && (
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn(
                    '-mr-1 flex p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white',
                    variantStyles.closeButton
                  )}
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
