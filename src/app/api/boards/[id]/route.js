import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toBoard } from "@/lib/serializers";
import { fetchBoardWithDetails } from "@/lib/board-data";
import { getBoardRole, canView, canEdit, canManageMembers } from "@/lib/permissions";

export async function GET(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canView(role)) return fail("You don't have access to this board.", 403);

  const board = await fetchBoardWithDetails(boardId);
  if (!board) return fail("Board not found.", 404);

  return ok({ board: toBoard(board, user.id) });
}

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const data = {};

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return fail("Title is required.", 422);
    data.title = title;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.color !== undefined) data.color = String(body.color || "#0079BF");

  const board = await prisma.board.update({
    where: { id: boardId },
    data: { ...data, updated_at: new Date() },
    include: {
      owner: true,
      members: { include: { user: true } },
      labels: true,
      lists: true,
      _count: { select: { members: true } },
    },
  });

  return ok({ message: "Board updated.", board: toBoard(board, user.id) });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canManageMembers(role)) return fail("Forbidden.", 403);

  await prisma.board.delete({ where: { id: boardId } });
  return ok({ message: "Board deleted." });
}
