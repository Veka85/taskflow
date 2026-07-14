import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toCard } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const listId = Number(routeParams.id);
  if (!Number.isFinite(listId)) return fail("Invalid list id.", 422);

  const list = await prisma.boardList.findUnique({ where: { id: listId } });
  if (!list) return fail("List not found.", 404);

  const role = await getBoardRole(list.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const title = String(body.title || "").trim();
  if (!title) return fail("Title is required.", 422);

  const maxPosition = await prisma.card.aggregate({
    where: { list_id: listId },
    _max: { position: true },
  });

  const now = new Date();
  const card = await prisma.card.create({
    data: {
      list_id: listId,
      title,
      description: body.description ? String(body.description) : null,
      position: (maxPosition._max.position ?? -1) + 1,
      due_date: body.due_date ? new Date(body.due_date) : null,
      cover_color: body.cover_color ? String(body.cover_color) : null,
      is_archived: false,
      created_at: now,
      updated_at: now,
    },
    include: {
      labels: { include: { label: true } },
      members: { include: { user: true } },
      comments: { include: { user: true }, orderBy: { created_at: "desc" } },
    },
  });

  return ok({ message: "Card created.", card: toCard(card) }, 201);
}
