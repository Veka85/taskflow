import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toCard } from "@/lib/serializers";
import { getBoardRole, canView, canEdit } from "@/lib/permissions";

async function loadCard(cardId) {
  return prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: true,
      labels: { include: { label: true } },
      members: { include: { user: true } },
      comments: { include: { user: true }, orderBy: { created_at: "desc" } },
    },
  });
}

export async function GET(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const card = await loadCard(cardId);
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canView(role)) return fail("Forbidden.", 403);

  return ok({ card: toCard(card) });
}

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const existing = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!existing) return fail("Card not found.", 404);

  const role = await getBoardRole(existing.list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const data = {};

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return fail("Title is required.", 422);
    data.title = title;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.cover_color !== undefined) data.cover_color = body.cover_color ? String(body.cover_color) : null;
  if (body.is_archived !== undefined) data.is_archived = Boolean(body.is_archived);
  if (body.due_date !== undefined) data.due_date = body.due_date ? new Date(body.due_date) : null;

  await prisma.card.update({
    where: { id: cardId },
    data: { ...data, updated_at: new Date() },
  });

  const card = await loadCard(cardId);
  return ok({ message: "Card updated.", card: toCard(card) });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const existing = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!existing) return fail("Card not found.", 404);

  const role = await getBoardRole(existing.list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  await prisma.card.delete({ where: { id: cardId } });
  return ok({ message: "Card deleted." });
}
