import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/http";
import { toUser } from "@/lib/serializers";

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return fail("Forbidden.", 403);

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const role = request.nextUrl.searchParams.get("role")?.trim() || "";
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const perPage = 15;

  const where = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return ok({
    users: { data: users.map(toUser) },
    meta: {
      current_page: page,
      last_page: lastPage,
      total,
      per_page: perPage,
    },
  });
}
