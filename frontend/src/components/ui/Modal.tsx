import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: keyof typeof sizeClasses;
  preventClose?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'md',
  preventClose = false,
  footer,
  children,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && !preventClose) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={cn(sizeClasses[size])}
        showCloseButton={!preventClose}
        onPointerDownOutside={(e) => {
          if (preventClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose) e.preventDefault();
        }}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
        {footer}
      </DialogContent>
    </Dialog>
  );
};

export const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <DialogFooter className={className}>{children}</DialogFooter>;
};
