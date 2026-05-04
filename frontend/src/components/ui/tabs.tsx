import { useState, createContext, useContext, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const value = controlledValue ?? uncontrolledValue;
  const setValue = (newValue: string) => {
    if (!controlledValue) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: setValue }}>
      <div className={twMerge(clsx('w-full', className))} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'pills';
}

export const TabsList: React.FC<TabsListProps> = ({
  variant = 'line',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex',
          variant === 'line'
            ? 'border-b border-neutral-200'
            : 'gap-2 p-1 bg-neutral-100 rounded-lg',
          className
        )
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={twMerge(
        clsx(
          'px-4 py-2 text-sm font-medium transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isActive
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-neutral-600 hover:text-neutral-900 border-b-2 border-transparent',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={twMerge(clsx('mt-4', className))}
      {...props}
    >
      {children}
    </div>
  );
};
