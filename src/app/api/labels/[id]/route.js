import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toLabel } from "@/lib/serializers";
import { getBoardRole, canEdit } from "@/lib/permissions";

export async function PUT(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const labelId = Number(routeParams.id);
  if (!Number.isFinite(labelId)) return fail("Invalid label id.", 422);

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) return fail("Label not found.", 404);

  const role = await getBoardRole(label.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const data = {};

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) return fail("Name is required.", 422);
    data.name = name;
  }
  if (body.color !== undefined) {
    const color = String(body.color || "").trim();
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return fail("Color must be valid hex.", 422);
    data.color = color;
  }

  const updated = await prisma.label.update({
    where: { id: labelId },
    data: { ...data, updated_at: new Date() },
  });

  return ok({ label: toLabel(updated) });
}

export async function DELETE(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const labelId = Number(routeParams.id);
  if (!Number.isFinite(labelId)) return fail("Invalid label id.", 422);

  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) return fail("Label not found.", 404);

  const role = await getBoardRole(label.board_id, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  await prisma.label.delete({ where: { id: labelId } });
  return ok({ message: "Label deleted." });
}
