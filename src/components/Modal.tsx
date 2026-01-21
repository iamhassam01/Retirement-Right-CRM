import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** If true, modal takes full screen on mobile (default: true) */
  fullScreenOnMobile?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  fullScreenOnMobile = true
}) => {
  const { isMobile, prefersReducedMotion } = useResponsiveView();

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

  const isFullScreen = isMobile && fullScreenOnMobile;
  const animationClass = prefersReducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-200';
  const mobileAnimationClass = prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-bottom-4 duration-300';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-navy-900/40 backdrop-blur-sm ${prefersReducedMotion ? '' : 'transition-opacity'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div
        className={`relative bg-white overflow-hidden shadow-2xl flex flex-col
          ${isFullScreen
            ? `w-full h-full max-h-full rounded-none ${mobileAnimationClass}`
            : `w-full max-w-lg mx-4 my-4 max-h-[90vh] rounded-xl ${animationClass}`
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky on mobile */}
        <div className={`flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0 ${isFullScreen ? 'sticky top-0 bg-white z-10' : ''}`}
          style={isFullScreen ? { paddingTop: 'max(env(safe-area-inset-top), 16px)' } : undefined}
        >
          <h3 id="modal-title" className="text-lg font-bold text-navy-900 truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 active:text-rose-600 transition-colors p-2 rounded-full hover:bg-slate-50 active:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className={`flex-1 overflow-y-auto ${isFullScreen ? 'px-4 py-4' : 'p-4 sm:p-6'}`}
          style={isFullScreen ? { paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;