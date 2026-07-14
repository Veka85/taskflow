import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toLabel } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: true,
      labels: true,
    },
  });
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const labelId = Number(body.label_id);
  if (!Number.isFinite(labelId)) return fail("label_id is required.", 422);

  const existing = await prisma.cardLabel.findUnique({
    where: {
      card_id_label_id: {
        card_id: cardId,
        label_id: labelId,
      },
    },
  });

  if (existing) {
    await prisma.cardLabel.delete({ where: { id: existing.id } });
  } else {
    await prisma.cardLabel.create({
      data: {
        card_id: cardId,
        label_id: labelId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  const labels = await prisma.cardLabel.findMany({
    where: { card_id: cardId },
    include: { label: true },
  });

  return ok({
    message: "Label toggled.",
    labels: labels.map((entry) => toLabel(entry.label)),
  });
}
