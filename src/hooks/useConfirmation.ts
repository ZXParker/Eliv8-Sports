import { useState, useCallback } from 'react';

interface UseConfirmationOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirmation(options: UseConfirmationOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback(() => {
    return new Promise<boolean>((res) => {
      setIsOpen(true);
      setResolve(() => res);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolve?.(true);
    setIsOpen(false);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    resolve?.(false);
    setIsOpen(false);
  }, [resolve]);

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
    options: {
      title: options.title ?? 'Confirm Action',
      message: options.message ?? 'Are you sure you want to proceed?',
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
    },
  };
}
