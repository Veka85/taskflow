import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toBoard } from "@/lib/serializers";
import { getAccessibleBoardIds } from "@/lib/board-access";

export async function GET(request) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const boardIds = await getAccessibleBoardIds(user.id);
  const boards = await prisma.board.findMany({
    where: {
      id: { in: boardIds },
      is_archived: false,
    },
    include: {
      owner: true,
      members: true,
      _count: { select: { members: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return ok({ data: boards.map((board) => toBoard(board, user.id)) });
}

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const body = await parseJson(request);
  const title = String(body.title || "").trim();
  if (!title) return fail("Title is required.", 422);

  const now = new Date();

  const board = await prisma.board.create({
    data: {
      user_id: user.id,
      title,
      description: body.description ? String(body.description) : null,
      color: body.color ? String(body.color) : "#0079BF",
      is_archived: false,
      created_at: now,
      updated_at: now,
    },
  });

  await prisma.boardMember.create({
    data: {
      board_id: board.id,
      user_id: user.id,
      role: "owner",
      created_at: now,
      updated_at: now,
    },
  });

  const fullBoard = await prisma.board.findUnique({
    where: { id: board.id },
    include: {
      owner: true,
      members: { include: { user: true } },
      labels: true,
      lists: true,
      _count: { select: { members: true } },
    },
  });

  return ok({
    message: "Board created successfully.",
    board: toBoard(fullBoard, user.id),
  }, 201);
}
