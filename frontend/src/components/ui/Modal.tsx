import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  allowMaximize?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
  allowMaximize = false,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMaximized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[96vw] w-[96vw]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={cn(
            'w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all duration-200 border border-slate-200 z-10 animate-scale-in',
            isMaximized
              ? 'max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] flex flex-col'
              : sizeClasses[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 shrink-0">
              <div className="space-y-1 pr-4">
                {typeof title === 'string' ? (
                  <h3 className="text-lg font-bold text-slate-900 leading-6">{title}</h3>
                ) : (
                  title
                )}
                {description && <p className="text-xs text-slate-500">{description}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {allowMaximize && (
                  <button
                    onClick={() => setIsMaximized((prev) => !prev)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                    aria-label={isMaximized ? 'Thu nhỏ' : 'Phóng to'}
                    title={isMaximized ? 'Thu nhỏ kích thước' : 'Phóng to toàn màn hình'}
                  >
                    {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                  aria-label="Đóng"
                  title="Đóng hộp thoại (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div
            className={cn(
              'px-6 py-5 overflow-y-auto',
              isMaximized ? 'flex-1 max-h-[calc(92vh-130px)]' : 'max-h-[75vh]'
            )}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
