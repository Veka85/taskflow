import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toComment } from "@/lib/serializers";
import { getBoardRole, canView } from "@/lib/permissions";

export async function GET(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canView(role)) return fail("Forbidden.", 403);

  const comments = await prisma.comment.findMany({
    where: { card_id: cardId },
    orderBy: { created_at: "desc" },
    include: { user: true },
  });

  return ok({ comments: comments.map(toComment) });
}

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const cardId = Number(routeParams.id);
  if (!Number.isFinite(cardId)) return fail("Invalid card id.", 422);

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) return fail("Card not found.", 404);

  const role = await getBoardRole(card.list.board_id, user.id, user.role);
  if (!canView(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const commentBody = String(body.body || "").trim();
  if (!commentBody) return fail("Comment body is required.", 422);

  const comment = await prisma.comment.create({
    data: {
      card_id: cardId,
      user_id: user.id,
      body: commentBody,
      created_at: new Date(),
      updated_at: new Date(),
    },
    include: { user: true },
  });

  return ok({ message: "Comment posted.", comment: toComment(comment) }, 201);
}
