import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const listIds = Array.isArray(body.list_ids) ? body.list_ids : null;
  if (!listIds) return fail("list_ids must be an array.", 422);

  await Promise.all(
    listIds.map((id, index) =>
      prisma.boardList.updateMany({
        where: { id: Number(id), board_id: boardId },
        data: { position: index, updated_at: new Date() },
      })
    )
  );

  return ok({ message: "Lists reordered." });
}
