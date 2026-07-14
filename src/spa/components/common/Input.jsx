// A controlled input component with label and error state
// CONCEPT — Controlled Input:
// In React, a "controlled" input means its value is driven by React state.
// onChange updates the state, which re-renders the component with the new value.
// This is the React way — it keeps the UI and data in sync.

export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border rounded-md text-sm
          outline-none transition-colors
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
