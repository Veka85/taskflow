import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { getBoardRole, canManageMembers } from "@/lib/permissions";

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  const userId = Number(routeParams.userId);
  if (!Number.isFinite(boardId) || !Number.isFinite(userId)) return fail("Invalid id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canManageMembers(role)) return fail("Forbidden.", 403);

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return fail("Board not found.", 404);

  if (board.user_id === userId) return fail("Cannot remove the board owner.", 422);

  await prisma.boardMember.deleteMany({
    where: {
      board_id: boardId,
      user_id: userId,
    },
  });

  return ok({ message: "Member removed." });
}
