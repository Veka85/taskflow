export function avatarUrl(user) {
  if (!user) return null;
  if (user.avatar && (user.avatar.startsWith("http://") || user.avatar.startsWith("https://"))) {
    return user.avatar;
  }
  if (user.avatar) {
    return `/storage/${user.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
}

export function toUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: avatarUrl(user),
    created_at: user.created_at instanceof Date ? user.created_at.toISOString().slice(0, 10) : user.created_at,
  };
}

export function toLabel(label) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    board_id: label.board_id,
  };
}

export function toComment(comment) {
  return {
    id: comment.id,
    body: comment.body,
    author: comment.user ? toUser(comment.user) : undefined,
    created_at: comment.created_at instanceof Date ? comment.created_at.toLocaleString() : comment.created_at,
    updated_at: comment.updated_at instanceof Date ? comment.updated_at.toISOString() : comment.updated_at,
  };
}

export function toCard(card) {
  return {
    id: card.id,
    list_id: card.list_id,
    title: card.title,
    description: card.description,
    position: card.position,
    due_date: card.due_date ? new Date(card.due_date).toISOString() : null,
    cover_color: card.cover_color,
    is_archived: card.is_archived,
    labels: card.labels ? card.labels.map((entry) => toLabel(entry.label || entry)) : [],
    members: card.members ? card.members.map((entry) => toUser(entry.user || entry)) : [],
    comments: card.comments ? card.comments.map(toComment) : [],
    comment_count: card.comments ? card.comments.length : 0,
    created_at: card.created_at instanceof Date ? card.created_at.toISOString() : card.created_at,
    updated_at: card.updated_at instanceof Date ? card.updated_at.toISOString() : card.updated_at,
  };
}

export function toList(list) {
  return {
    id: list.id,
    board_id: list.board_id,
    title: list.title,
    position: list.position,
    is_archived: list.is_archived,
    cards: list.cards ? list.cards.map(toCard) : [],
    created_at: list.created_at instanceof Date ? list.created_at.toISOString() : list.created_at,
  };
}

export function toBoard(board, currentUserId) {
  let myRole = null;
  if (board.user_id === currentUserId) {
    myRole = "owner";
  }
  if (!myRole && board.members) {
    const mine = board.members.find((member) => member.user_id === currentUserId);
    if (mine) myRole = mine.role;
  }

  return {
    id: board.id,
    title: board.title,
    description: board.description,
    color: board.color,
    is_archived: board.is_archived,
    owner: board.owner ? toUser(board.owner) : undefined,
    lists: board.lists ? board.lists.map(toList) : [],
    members: board.members ? board.members.map((member) => {
      if (member.user) {
        return { ...toUser(member.user), role: member.role };
      }
      return member;
    }) : [],
    labels: board.labels ? board.labels.map(toLabel) : [],
    my_role: myRole,
    members_count: board._count?.members ?? board.members?.length ?? 0,
    created_at: board.created_at instanceof Date ? board.created_at.toISOString() : board.created_at,
    updated_at: board.updated_at instanceof Date ? board.updated_at.toISOString() : board.updated_at,
  };
}
