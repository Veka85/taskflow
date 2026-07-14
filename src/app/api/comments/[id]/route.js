import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toComment } from "@/lib/serializers";

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const commentId = Number(routeParams.id);
  if (!Number.isFinite(commentId)) return fail("Invalid comment id.", 422);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return fail("Comment not found.", 404);

  if (comment.user_id !== user.id && user.role !== "admin") {
    return fail("Forbidden.", 403);
  }

  const body = await parseJson(request);
  const commentBody = String(body.body || "").trim();
  if (!commentBody) return fail("Comment body is required.", 422);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: commentBody, updated_at: new Date() },
    include: { user: true },
  });

  return ok({ message: "Comment updated.", comment: toComment(updated) });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const commentId = Number(routeParams.id);
  if (!Number.isFinite(commentId)) return fail("Invalid comment id.", 422);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return fail("Comment not found.", 404);

  if (comment.user_id !== user.id && user.role !== "admin") {
    return fail("Forbidden.", 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return ok({ message: "Comment deleted." });
}
