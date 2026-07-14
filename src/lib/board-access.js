import { prisma } from "@/lib/prisma";

export async function getAccessibleBoardIds(userId) {
  const owned = await prisma.board.findMany({
    where: { user_id: userId },
    select: { id: true },
  });

  const memberships = await prisma.boardMember.findMany({
    where: { user_id: userId },
    select: { board_id: true },
  });

  return [...new Set([...owned.map((b) => b.id), ...memberships.map((m) => m.board_id)])];
}
