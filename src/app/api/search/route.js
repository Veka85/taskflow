import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { getAccessibleBoardIds } from "@/lib/board-access";

export async function GET(request) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return fail("Search query must be at least 2 characters.", 422);
  }

  const boardIds = await getAccessibleBoardIds(user.id);

  const boards = await prisma.board.findMany({
    where: {
      id: { in: boardIds },
      is_archived: false,
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    select: { id: true, title: true, color: true },
    take: 5,
  });

  const cards = await prisma.card.findMany({
    where: {
      is_archived: false,
      list: {
        board_id: { in: boardIds },
      },
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: {
      list: {
        include: {
          board: {
            select: { id: true, title: true },
          },
        },
      },
    },
    take: 10,
  });

  return ok({
    boards,
    cards: cards.map((card) => ({
      id: card.id,
      title: card.title,
      board_id: card.list.board.id,
      board_name: card.list.board.title,
    })),
  });
}
