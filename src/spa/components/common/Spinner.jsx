export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm:  'w-4 h-4 border-2',
    md:  'w-8 h-8 border-3',
    lg:  'w-12 h-12 border-4',
  };
  return (
    <div
      className={`
        ${sizes[size]}
        border-blue-600 border-t-transparent rounded-full animate-spin
        ${className}
      `}
    />
  );
}

// Full-page loading state
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
