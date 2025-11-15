// src/hooks/useConfirm.tsx
import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success' | 'default';
  confirmButtonVariant?: 'primary' | 'danger' | 'success' | 'warning';
  showIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const variantConfig = {
  danger: {
    icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
    iconBgClass: 'bg-red-100',
    defaultTitle: 'Confirm Deletion'
  },
  warning: {
    icon: <AlertCircle className="h-12 w-12 text-yellow-500" />,
    confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    iconBgClass: 'bg-yellow-100',
    defaultTitle: 'Warning'
  },
  info: {
    icon: <Info className="h-12 w-12 text-blue-500" />,
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    iconBgClass: 'bg-blue-100',
    defaultTitle: 'Information'
  },
  success: {
    icon: <CheckCircle className="h-12 w-12 text-green-500" />,
    confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white',
    iconBgClass: 'bg-green-100',
    defaultTitle: 'Confirm'
  },
  default: {
    icon: <Info className="h-12 w-12 text-gray-500" />,
    confirmButtonClass: 'bg-gray-600 hover:bg-gray-700 text-white',
    iconBgClass: 'bg-gray-100',
    defaultTitle: 'Confirm Action'
  }
};

const buttonVariantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
};

// Provider Component
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleConfirm = async () => {
    if (!confirmState) return;

    setLoading(true);
    try {
      if (confirmState.options.onConfirm) {
        await confirmState.options.onConfirm();
      }
      confirmState.resolve(true);
      setConfirmState(null);
    } catch (error) {
      console.error('Error in confirm action:', error);
      // Don't close the dialog on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!confirmState || loading) return;
    
    if (confirmState.options.onCancel) {
      confirmState.options.onCancel();
    }
    confirmState.resolve(false);
    setConfirmState(null);
  };

  const variant = confirmState?.options.variant || 'default';
  const config = variantConfig[variant];
  const confirmButtonVariant = confirmState?.options.confirmButtonVariant || 
    (variant === 'danger' ? 'danger' : 'primary');

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <Modal
          isOpen={confirmState.isOpen}
          onClose={handleCancel}
          title={confirmState.options.title || config.defaultTitle}
          size="sm"
          preventClose={loading}
          closeOnEscape={!loading}
          closeOnBackdrop={!loading}
        >
          <div className="text-center">
            {confirmState.options.showIcon !== false && (
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${config.iconBgClass} mb-4`}>
                {config.icon}
              </div>
            )}
            <div className="text-gray-700">
              {typeof confirmState.options.message === 'string' ? (
                <p>{confirmState.options.message}</p>
              ) : (
                confirmState.options.message
              )}
            </div>
          </div>
          
          <ModalFooter className="mt-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {confirmState.options.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                buttonVariantClasses[confirmButtonVariant]
              }`}
            >
              {loading ? 'Processing...' : (confirmState.options.confirmText || 'Confirm')}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
};

// Hook
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

// Standalone confirm function for simple cases
export const simpleConfirm = (message: string, title?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const result = window.confirm(title ? `${title}\n\n${message}` : message);
    resolve(result);
  });
};

// Pre-configured confirm functions
export const useDeleteConfirm = () => {
  const confirm = useConfirm();
  
  return useCallback((entityName: string = 'item') => {
    return confirm({
      title: `Delete ${entityName}`,
      message: `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      confirmButtonVariant: 'danger'
    });
  }, [confirm]);
};

export const useDiscardConfirm = () => {
  const confirm = useConfirm();
  
  return useCallback(() => {
    return confirm({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      variant: 'warning',
      confirmButtonVariant: 'warning'
    });
  }, [confirm]);
};

export const useSaveConfirm = () => {
  const confirm = useConfirm();
  
  return useCallback((message?: string) => {
    return confirm({
      title: 'Save Changes',
      message: message || 'Do you want to save your changes?',
      confirmText: 'Save',
      cancelText: 'Cancel',
      variant: 'info',
      confirmButtonVariant: 'primary'
    });
  }, [confirm]);
};
