import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toUser } from "@/lib/serializers";
import { getBoardRole, canView, canManageMembers } from "@/lib/permissions";

export async function GET(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canView(role)) return fail("Forbidden.", 403);

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: true,
      members: {
        include: { user: true },
      },
    },
  });

  if (!board) return fail("Board not found.", 404);

  const members = board.members.map((member) => ({ ...toUser(member.user), role: member.role }));
  if (!members.some((member) => member.id === board.owner.id)) {
    members.unshift({ ...toUser(board.owner), role: "owner" });
  }

  return ok({ members });
}

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canManageMembers(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const memberRole = String(body.role || "member");

  if (!email) return fail("Email is required.", 422);
  if (!["member", "viewer"].includes(memberRole)) return fail("Invalid role.", 422);

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return fail("Board not found.", 404);

  const memberUser = await prisma.user.findUnique({ where: { email } });
  if (!memberUser) return fail("User not found.", 422);

  if (memberUser.id === board.user_id) {
    return fail("User is already the board owner.", 422);
  }

  const existing = await prisma.boardMember.findUnique({
    where: {
      board_id_user_id: {
        board_id: boardId,
        user_id: memberUser.id,
      },
    },
  });

  if (existing) return fail("User is already a member.", 422);

  const now = new Date();
  await prisma.boardMember.create({
    data: {
      board_id: boardId,
      user_id: memberUser.id,
      role: memberRole,
      created_at: now,
      updated_at: now,
    },
  });

  return ok({ message: "Member added successfully." });
}
