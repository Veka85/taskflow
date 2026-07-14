import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  const memberId = Number(routeParams.userId);
  if (!Number.isFinite(cardId) || !Number.isFinite(memberId)) return fail("Invalid id.", 422);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  await prisma.cardMember.deleteMany({ where: { card_id: cardId, user_id: memberId } });
  return ok({ message: "Member removed from card." });
}
