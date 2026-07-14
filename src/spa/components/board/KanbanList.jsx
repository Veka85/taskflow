import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { cardsApi } from '../../api/cards';
import { listsApi } from '../../api/lists';
import { getErrorMessage } from '../../utils/helpers';

// CONCEPT — Droppable Container:
// A list (column) is a drop zone where cards can be dropped.
// `useDroppable` makes this div accept dragged cards.
// `SortableContext` enables sorting within this list.
// When a card is dragged over, dnd-kit tracks which list is the active target.

export default function KanbanList({ list, onCardClick, onCardUpdated, onCardDeleted, onListUpdated, onListDeleted }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle]       = useState(list.title);
  const [addingCard, setAddingCard]     = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  // useDroppable makes this list a valid drop target for cards
  const { setNodeRef, isOver } = useDroppable({ id: `list-${list.id}` });

  const handleTitleBlur = async () => {
    if (listTitle.trim() && listTitle !== list.title) {
      try {
        await listsApi.update(list.id, { title: listTitle });
        onListUpdated({ ...list, title: listTitle });
      } catch (err) {
        setListTitle(list.title); // Revert on failure
      }
    }
    setEditingTitle(false);
  };

  const handleAddCard = async (e) => {
    e?.preventDefault();
    if (!newCardTitle.trim()) return;
    setAddingLoading(true);
    try {
      const { data } = await cardsApi.create(list.id, { title: newCardTitle });
      onCardUpdated(data.card, list.id, 'added');
      setNewCardTitle('');
      setAddingCard(false);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setAddingLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm(`Delete list "${list.title}" and all its cards?`)) return;
    try {
      await listsApi.delete(list.id);
      onListDeleted(list.id);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
  };

  // Card IDs as strings for SortableContext
  const cardIds = list.cards.map((c) => `card-${c.id}`);

  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* List header */}
      <div
        className={`
          rounded-xl flex flex-col
          transition-colors
          ${isOver ? 'bg-blue-50/50' : 'bg-gray-100/80'}
        `}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          {editingTitle ? (
            <input
              className="flex-1 font-semibold text-sm bg-white border border-blue-500 rounded px-2 py-0.5 outline-none"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); if (e.key === 'Escape') { setListTitle(list.title); setEditingTitle(false); } }}
              autoFocus
            />
          ) : (
            <h3
              className="font-semibold text-sm text-gray-800 cursor-pointer flex-1 hover:bg-white/50 rounded px-1 py-0.5"
              onClick={() => setEditingTitle(true)}
            >
              {list.title}
              <span className="ml-2 text-xs text-gray-400 font-normal">{list.cards.length}</span>
            </h3>
          )}

          <button
            onClick={handleDeleteList}
            className="ml-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors text-lg font-light leading-none"
            title="Delete list"
          >
            ×
          </button>
        </div>

        {/* Cards drop area */}
        <div
          ref={setNodeRef}
          className={`
            px-2 pb-2 flex flex-col gap-2 min-h-[40px]
            ${isOver ? 'bg-blue-100/30 rounded-lg' : ''}
          `}
        >
          {/* SortableContext enables sortable behavior within this list */}
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {list.cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onCardClick={onCardClick}
              />
            ))}
          </SortableContext>
        </div>

        {/* Add card section */}
        {addingCard ? (
          <div className="px-2 pb-2">
            <textarea
              className="w-full text-sm border border-blue-500 rounded-lg p-2 resize-none outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              rows={2}
              placeholder="Enter card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); } if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); } }}
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleAddCard}
                disabled={addingLoading || !newCardTitle.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {addingLoading ? 'Adding...' : 'Add Card'}
              </button>
              <button
                onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                className="px-3 py-1 text-gray-500 text-xs hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="mx-2 mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg px-2 py-1.5 transition-colors"
          >
            <span className="text-base font-medium">+</span> Add a card
          </button>
        )}
      </div>
    </div>
  );
}
