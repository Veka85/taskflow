import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toCard } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";
import { normalizeCardPositions } from "@/lib/cards";

export async function PUT(request, { params }) {
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
  const newListId = Number(body.list_id);
  const newPosition = Number(body.position);
  if (!Number.isFinite(newListId) || !Number.isFinite(newPosition)) {
    return fail("list_id and position are required.", 422);
  }

  const oldListId = card.list_id;

  await prisma.card.update({
    where: { id: cardId },
    data: {
      list_id: newListId,
      position: newPosition,
      updated_at: new Date(),
    },
  });

  await normalizeCardPositions(newListId);
  if (oldListId !== newListId) {
    await normalizeCardPositions(oldListId);
  }

  const updated = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      labels: { include: { label: true } },
      members: { include: { user: true } },
      comments: { include: { user: true }, orderBy: { created_at: "desc" } },
    },
  });

  return ok({ message: "Card moved.", card: toCard(updated) });
}
