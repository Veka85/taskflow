import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  await prisma.board.update({
    where: { id: boardId },
    data: { is_archived: true, updated_at: new Date() },
  });

  return ok({ message: "Board archived." });
}
