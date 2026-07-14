import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { toUser } from "@/lib/serializers";

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return fail("Forbidden.", 403);

  const [totalUsers, totalBoards, totalCards, totalComments, activeBoards, adminUsers, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.board.count(),
    prisma.card.count(),
    prisma.comment.count(),
    prisma.board.count({ where: { is_archived: false } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
    }),
  ]);

  return ok({
    stats: {
      total_users: totalUsers,
      total_boards: totalBoards,
      total_cards: totalCards,
      total_comments: totalComments,
      active_boards: activeBoards,
      admin_users: adminUsers,
    },
    recent_users: recentUsers.map(toUser),
  });
}
