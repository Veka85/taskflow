import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

import { boardsApi } from '../api/boards';
import { listsApi } from '../api/lists';
import { cardsApi } from '../api/cards';
import { getErrorMessage } from '../utils/helpers';

import Navbar from '../components/layout/Navbar';
import KanbanList from '../components/board/KanbanList';
import KanbanCard from '../components/board/KanbanCard';
import CardModal from '../components/board/CardModal';
import { PageSpinner } from '../components/common/Spinner';

// CONCEPT — DnD Architecture:
// @dnd-kit uses a context-based system:
//   1. DndContext wraps all draggable and droppable elements
//   2. Each card is wrapped in useSortable (makes it draggable)
//   3. Each list is a useDroppable (makes it a drop target)
//   4. DragOverlay renders a "ghost" copy of the card while dragging
//
// Key events:
//   onDragStart  — user picks up a card
//   onDragOver   — card is dragged over a different list (show preview)
//   onDragEnd    — user drops the card (commit the move)

export default function BoardPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [board, setBoard]     = useState(null);
  const [lists, setLists]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [myRole, setMyRole]   = useState(null);

  // Active drag state
  const [activeCard, setActiveCard]   = useState(null);
  const [activeListId, setActiveListId] = useState(null);

  // Card modal state
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  // Adding a new list
  const [addingList, setAddingList]   = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addListLoading, setAddListLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch board data
  // -------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    boardsApi.getById(id)
      .then(({ data }) => {
        setBoard(data.board);
        setLists(data.board.lists || []);
        setMyRole(data.board.my_role);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setError("You don't have access to this board.");
        } else {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // -------------------------------------------------------------------------
  // DnD Sensors
  // CONCEPT — Sensors:
  // Sensors define HOW drag is initiated.
  // PointerSensor: mouse or touch drag after 5px movement (prevents accidental drags on click)
  // KeyboardSensor: allows drag with keyboard (accessibility)
  // -------------------------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Must move 5px before drag starts
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // -------------------------------------------------------------------------
  // Helper: find which list contains a card by its ID
  // -------------------------------------------------------------------------
  const findListByCardId = useCallback((cardId) => {
    const numericId = parseInt(cardId.replace('card-', ''));
    return lists.find((list) => list.cards.some((c) => c.id === numericId));
  }, [lists]);

  // -------------------------------------------------------------------------
  // DnD: drag start — record which card we're dragging
  // -------------------------------------------------------------------------
  const handleDragStart = useCallback(({ active }) => {
    const list = findListByCardId(active.id);
    if (!list) return;
    const numericId = parseInt(active.id.replace('card-', ''));
    const card = list.cards.find((c) => c.id === numericId);
    setActiveCard(card);
    setActiveListId(list.id);
  }, [findListByCardId]);

  // -------------------------------------------------------------------------
  // DnD: drag over — show the card in its new position visually
  // This gives the "live preview" feel while dragging
  // -------------------------------------------------------------------------
  const handleDragOver = useCallback(({ active, over }) => {
    if (!over || !active || active.id === over.id) return;

    const activeListObj = findListByCardId(active.id);
    const overListId    = over.id.startsWith('list-')
      ? parseInt(over.id.replace('list-', ''))
      : findListByCardId(over.id)?.id;

    if (!activeListObj || !overListId) return;
    if (activeListObj.id === overListId) return;

    // Moving to a different list: remove from old, add to new
    setLists((prev) => {
      const numericActiveId = parseInt(active.id.replace('card-', ''));
      const draggedCard = activeListObj.cards.find((c) => c.id === numericActiveId);
      if (!draggedCard) return prev;

      return prev.map((list) => {
        if (list.id === activeListObj.id) {
          return { ...list, cards: list.cards.filter((c) => c.id !== numericActiveId) };
        }
        if (list.id === overListId) {
          return { ...list, cards: [...list.cards, { ...draggedCard, list_id: overListId }] };
        }
        return list;
      });
    });
  }, [findListByCardId]);

  // -------------------------------------------------------------------------
  // DnD: drag end — commit the move to the server
  // -------------------------------------------------------------------------
  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveCard(null);
    setActiveListId(null);

    if (!over || !active) return;

    const numericActiveId = parseInt(active.id.replace('card-', ''));
    const destinationList = findListByCardId(active.id); // After drag-over updated state

    if (!destinationList) return;

    const newPosition = destinationList.cards.findIndex((c) => c.id === numericActiveId);

    // Reorder within same list
    if (over.id.startsWith('card-')) {
      const numericOverId = parseInt(over.id.replace('card-', ''));
      const sourceList = lists.find((l) => l.id === activeListId);

      if (sourceList && sourceList.id === destinationList.id) {
        const oldIndex = sourceList.cards.findIndex((c) => c.id === numericActiveId);
        const newIndex = sourceList.cards.findIndex((c) => c.id === numericOverId);

        if (oldIndex !== newIndex) {
          const reordered = arrayMove(sourceList.cards, oldIndex, newIndex);
          setLists((prev) =>
            prev.map((l) => l.id === sourceList.id ? { ...l, cards: reordered } : l)
          );
          // Persist new order to server
          await cardsApi.reorder(sourceList.id, reordered.map((c) => c.id));
        }
        return;
      }
    }

    // Moving to a different list — call the move API
    try {
      await cardsApi.move(numericActiveId, {
        list_id:  destinationList.id,
        position: newPosition,
      });
    } catch (err) {
      console.error('Failed to move card:', getErrorMessage(err));
    }
  }, [findListByCardId, lists, activeListId]);

  // -------------------------------------------------------------------------
  // Add a new list
  // -------------------------------------------------------------------------
  const handleAddList = async (e) => {
    e?.preventDefault();
    if (!newListTitle.trim()) return;
    setAddListLoading(true);
    try {
      const { data } = await listsApi.create(id, { title: newListTitle });
      setLists([...lists, { ...data.list, cards: [] }]);
      setNewListTitle('');
      setAddingList(false);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setAddListLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Card CRUD callbacks (passed down to child components)
  // -------------------------------------------------------------------------
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setCardModalOpen(true);
  };

  const handleCardUpdated = useCallback((updatedCard, listId, action) => {
    setLists((prev) =>
      prev.map((list) => {
        if (action === 'added' && list.id === listId) {
          return { ...list, cards: [...list.cards, updatedCard] };
        }
        return {
          ...list,
          cards: list.cards.map((c) => c.id === updatedCard.id ? updatedCard : c),
        };
      })
    );
    // Update modal card if it's open
    if (selectedCard?.id === updatedCard.id) {
      setSelectedCard(updatedCard);
    }
  }, [selectedCard]);

  const handleCardDeleted = useCallback((cardId) => {
    setLists((prev) =>
      prev.map((list) => ({ ...list, cards: list.cards.filter((c) => c.id !== cardId) }))
    );
    setCardModalOpen(false);
  }, []);

  const handleListUpdated = useCallback((updatedList) => {
    setLists((prev) => prev.map((l) => l.id === updatedList.id ? { ...l, ...updatedList } : l));
  }, []);

  const handleListDeleted = useCallback((listId) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) return <div className="min-h-screen bg-gray-100"><Navbar /><PageSpinner /></div>;

  if (error) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
          <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: board?.color || '#0079BF' }}>
      <Navbar />

      {/* Board header */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Boards
          </Link>
          <h1 className="text-white font-bold text-xl">{board?.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {board?.members?.slice(0, 5).map((member) => (
              <img
                key={member.id}
                src={member.avatar}
                alt={member.name}
                title={member.name}
                className="w-8 h-8 rounded-full border-2 border-white/50 object-cover"
              />
            ))}
          </div>
          {(myRole === 'owner' || myRole === 'admin') && (
            <Link
              to={`/boards/${id}/settings`}
              className="text-white/80 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              ⚙ Settings
            </Link>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-scroll flex gap-4 px-6 pb-6 pt-2 h-full items-start">
            {lists.map((list) => (
              <KanbanList
                key={list.id}
                list={list}
                onCardClick={handleCardClick}
                onCardUpdated={handleCardUpdated}
                onCardDeleted={handleCardDeleted}
                onListUpdated={handleListUpdated}
                onListDeleted={handleListDeleted}
              />
            ))}

            {/* Add List */}
            {addingList ? (
              <div className="w-72 shrink-0 bg-gray-100/80 rounded-xl p-3">
                <input
                  className="w-full border border-blue-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white mb-2"
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAddingList(false); setNewListTitle(''); } }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddList}
                    disabled={addListLoading || !newListTitle.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    Add List
                  </button>
                  <button
                    onClick={() => { setAddingList(false); setNewListTitle(''); }}
                    className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-72 shrink-0 h-12 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                + Add a list
              </button>
            )}
          </div>

          {/* DragOverlay: renders the "ghost" card that follows the cursor */}
          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 shadow-2xl">
                <KanbanCard card={activeCard} onCardClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardMembers={board?.members || []}
          boardLabels={board?.labels || []}
          isOpen={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          onUpdate={(updatedCard) => handleCardUpdated(updatedCard, updatedCard.list_id)}
        />
      )}
    </div>
  );
}
