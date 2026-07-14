import { prisma } from "@/lib/prisma";

export async function fetchBoardWithDetails(boardId) {
  return prisma.board.findUnique({
    where: { id: Number(boardId) },
    include: {
      owner: true,
      members: {
        include: { user: true },
      },
      labels: true,
      lists: {
        where: { is_archived: false },
        orderBy: { position: "asc" },
        include: {
          cards: {
            where: { is_archived: false },
            orderBy: { position: "asc" },
            include: {
              labels: { include: { label: true } },
              members: { include: { user: true } },
              comments: {
                orderBy: { created_at: "desc" },
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });
}
