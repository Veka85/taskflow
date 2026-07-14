import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toUser } from "@/lib/serializers";

export async function PUT(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return fail("Forbidden.", 403);

  const routeParams = await params;
  const userId = Number(routeParams.id);
  if (!Number.isFinite(userId)) return fail("Invalid user id.", 422);

  const body = await parseJson(request);
  const data = {};

  if (body.role !== undefined) {
    if (!["admin", "user"].includes(body.role)) return fail("Invalid role.", 422);

    if (admin.id === userId && body.role === "user") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) return fail("Cannot demote the only admin.", 422);
    }

    data.role = body.role;
  }

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) return fail("Name is required.", 422);
    data.name = name;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...data, updated_at: new Date() },
  });

  return ok({ message: "User updated.", user: toUser(user) });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return fail("Forbidden.", 403);

  const routeParams = await params;
  const userId = Number(routeParams.id);
  if (!Number.isFinite(userId)) return fail("Invalid user id.", 422);
  if (admin.id === userId) return fail("Cannot delete your own account.", 422);

  await prisma.user.delete({ where: { id: userId } });
  return ok({ message: "User deleted." });
}
