import { getContrastColor } from '../../utils/helpers';

// A colored label/badge chip (used for labels on cards)
export default function Badge({ label, color, onRemove, className = '' }) {
  const textColor = color ? getContrastColor(color) : undefined;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${!color ? 'bg-gray-200 text-gray-700' : ''}
        ${className}
      `}
      style={color ? { backgroundColor: color, color: textColor } : {}}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-70 transition-opacity ml-0.5 font-bold"
        >
          ×
        </button>
      )}
    </span>
  );
}
