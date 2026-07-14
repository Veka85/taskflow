import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toList } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";

async function getListAndRole(listId, user) {
  const list = await prisma.boardList.findUnique({
    where: { id: listId },
    include: { board: true },
  });
  if (!list) return { list: null, role: null };
  const role = await getBoardRole(list.board_id, user.id, user.role);
  return { list, role };
}

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const listId = Number(routeParams.id);
  if (!Number.isFinite(listId)) return fail("Invalid list id.", 422);

  const { list, role } = await getListAndRole(listId, user);
  if (!list) return fail("List not found.", 404);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const data = {};

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return fail("Title is required.", 422);
    data.title = title;
  }
  if (body.is_archived !== undefined) data.is_archived = Boolean(body.is_archived);

  const updated = await prisma.boardList.update({
    where: { id: listId },
    data: { ...data, updated_at: new Date() },
  });

  return ok({ message: "List updated.", list: toList(updated) });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const listId = Number(routeParams.id);
  if (!Number.isFinite(listId)) return fail("Invalid list id.", 422);

  const { list, role } = await getListAndRole(listId, user);
  if (!list) return fail("List not found.", 404);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  await prisma.boardList.delete({ where: { id: listId } });
  return ok({ message: "List deleted." });
}
