// src/components/ConfirmDialog/ConfirmProvider.tsx
import { useState, useCallback, createContext, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import type { ConfirmOptions, ConfirmContextType, ConfirmState } from './types';

// eslint-disable-next-line react-refresh/only-export-components
export const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!confirmState || loading) return;
    
    confirmState.options.onCancel?.();
    confirmState.resolve(false);
    setConfirmState(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      handleCancel();
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          options={confirmState.options}
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onOpenChange={handleOpenChange}
        />
      )}
    </ConfirmContext.Provider>
  );
};