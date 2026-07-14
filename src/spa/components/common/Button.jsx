// CONCEPT — Reusable Components:
// Instead of writing the same button styling 50 times across the app,
// we create one Button component with configurable variants.
// This ensures visual consistency and makes global style changes trivial.

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'hover:bg-gray-100 text-gray-600',
  success:   'bg-green-600 hover:bg-green-700 text-white',
};

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// CONCEPT — Props Destructuring:
// We destructure the props inline, with default values.
// `className` allows the parent to add extra styles (composition pattern).
// `...props` spreads any remaining props (like onClick, type, disabled) onto the button.
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
