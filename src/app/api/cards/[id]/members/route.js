import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const userId = Number(body.user_id);
  if (!Number.isFinite(userId)) return fail("user_id is required.", 422);

  const member = await prisma.boardMember.findUnique({
    where: {
      board_id_user_id: {
        board_id: card.list.board_id,
        user_id: userId,
      },
    },
  });
  if (!member && card.list.board_id) {
    const board = await prisma.board.findUnique({ where: { id: card.list.board_id } });
    if (!board || board.user_id !== userId) {
      return fail("User is not a board member.", 422);
    }
  }

  await prisma.cardMember.upsert({
    where: {
      card_id_user_id: {
        card_id: cardId,
        user_id: userId,
      },
    },
    update: { updated_at: new Date() },
    create: {
      card_id: cardId,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return ok({ message: "Member assigned to card." });
}
