import { prisma } from "@/lib/prisma";

export async function getBoardRole(boardId, userId, userRole) {
  if (userRole === "admin") return "admin";

  const board = await prisma.board.findUnique({
    where: { id: Number(boardId) },
    select: { user_id: true },
  });

  if (!board) return null;
  if (board.user_id === userId) return "owner";

  const membership = await prisma.boardMember.findUnique({
    where: {
      board_id_user_id: {
        board_id: Number(boardId),
        user_id: userId,
      },
    },
    select: { role: true },
  });

  return membership?.role || null;
}

export function canView(role) {
  return role === "admin" || role === "owner" || role === "member" || role === "viewer";
}

export function canEdit(role) {
  return role === "admin" || role === "owner" || role === "member";
}

export function canManageMembers(role) {
  return role === "admin" || role === "owner";
}
