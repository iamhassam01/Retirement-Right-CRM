import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Size variant: 'sm' (400px), 'md' (512px), 'lg' (640px), 'xl' (768px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const { prefersReducedMotion } = useResponsiveView();

  // Size mapping
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl'
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const animationClass = prefersReducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-200';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - Same blur on all screen sizes */}
      <div
        className={`absolute inset-0 bg-navy-900/40 backdrop-blur-sm ${prefersReducedMotion ? '' : 'transition-opacity'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content - Same visual design on all screens */}
      <div
        className={`relative bg-white overflow-hidden shadow-2xl flex flex-col
          w-full ${sizeClasses[size]} max-h-[calc(100vh-24px)] sm:max-h-[90vh] rounded-xl ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <h3 id="modal-title" className="text-base sm:text-lg font-bold text-navy-900 truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 active:text-rose-600 transition-colors p-2 rounded-full hover:bg-slate-50 active:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;