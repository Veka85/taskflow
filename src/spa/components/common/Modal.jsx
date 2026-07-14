import { useEffect } from 'react';

// CONCEPT — Modal Component:
// A modal is an overlay dialog. We render it using React Portals in production,
// but for simplicity we render it inline and use a high z-index.
//
// Key UX patterns implemented:
// - Press Escape to close (keyboard accessibility)
// - Click backdrop to close
// - Prevent body scroll while open

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) {
  // Close modal on Escape key press — keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden';

    // Cleanup: remove listener and restore scroll when modal closes
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    // Backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        // CONCEPT: Only close if the click was ON the backdrop, not a child element
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal panel */}
      <div
        className={`
          bg-white rounded-xl shadow-2xl w-full mt-8 mb-8
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl font-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
