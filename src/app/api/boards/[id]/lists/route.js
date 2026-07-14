import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toList } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const title = String(body.title || "").trim();
  if (!title) return fail("Title is required.", 422);

  const maxPosition = await prisma.boardList.aggregate({
    where: { board_id: boardId },
    _max: { position: true },
  });

  const list = await prisma.boardList.create({
    data: {
      board_id: boardId,
      title,
      position: (maxPosition._max.position ?? -1) + 1,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return ok({ message: "List created.", list: toList(list) }, 201);
}
