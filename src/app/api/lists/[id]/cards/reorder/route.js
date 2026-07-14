import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function PUT(request, { params }) {
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
  const cardIds = Array.isArray(body.card_ids) ? body.card_ids : null;
  if (!cardIds) return fail("card_ids must be an array.", 422);

  await Promise.all(
    cardIds.map((id, index) =>
      prisma.card.updateMany({
        where: { id: Number(id), list_id: listId },
        data: { position: index, updated_at: new Date() },
      })
    )
  );

  return ok({ message: "Cards reordered." });
}
