import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, isOverdue } from '../../utils/helpers';
import Badge from '../common/Badge';

// CONCEPT — @dnd-kit:
// @dnd-kit is a modern drag-and-drop library for React.
// `useSortable` gives us everything needed to make this card draggable:
//   - attributes: aria attributes for accessibility
//   - listeners: event handlers (onMouseDown, onTouchStart, etc.)
//   - setNodeRef: ref to attach to the DOM element
//   - transform/transition: CSS values for the drag animation
//
// When dragging: the card appears where the cursor is
// When dropped: React state updates, list re-renders in new order

export default function KanbanCard({ card, onCardClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card-${card.id}` });

  const style = {
    // CSS.Transform converts the transform object to a CSS string
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const overdue    = isOverdue(card.due_date);
  const hasLabels  = card.labels?.length > 0;
  const hasMembers = card.members?.length > 0;
  const commentCount = card.comment_count || card.comments?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick(card)}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        cursor-pointer hover:shadow-md transition-shadow
        active:cursor-grabbing select-none
        ${isDragging ? 'rotate-1 shadow-lg' : ''}
      `}
    >
      {/* Cover color strip */}
      {card.cover_color && (
        <div
          className="h-6 rounded-t-lg"
          style={{ backgroundColor: card.cover_color }}
        />
      )}

      <div className="p-3">
        {/* Labels */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label) => (
              <Badge key={label.id} label={label.name} color={label.color} />
            ))}
          </div>
        )}

        {/* Card title */}
        <p className="text-sm text-gray-800 font-medium leading-snug mb-2">
          {card.title}
        </p>

        {/* Footer: metadata row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due date badge */}
            {card.due_date && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded flex items-center gap-1
                ${overdue
                  ? 'bg-red-100 text-red-600 font-medium'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                🗓 {formatDate(card.due_date)}
              </span>
            )}

            {/* Comment count */}
            {commentCount > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                💬 {commentCount}
              </span>
            )}
          </div>

          {/* Assigned member avatars */}
          {hasMembers && (
            <div className="flex -space-x-1.5">
              {card.members.slice(0, 3).map((member) => (
                <img
                  key={member.id}
                  src={member.avatar}
                  alt={member.name}
                  title={member.name}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                />
              ))}
              {card.members.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                  +{card.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
