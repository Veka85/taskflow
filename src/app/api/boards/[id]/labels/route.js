import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toLabel } from "@/lib/serializers";
import { getBoardRole, canView, canEdit } from "@/lib/permissions";

export async function GET(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canView(role)) return fail("Forbidden.", 403);

  const labels = await prisma.label.findMany({ where: { board_id: boardId } });
  return ok({ labels: labels.map(toLabel) });
}

export async function POST(request, { params }) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);

  const routeParams = await params;
  const boardId = Number(routeParams.id);
  if (!Number.isFinite(boardId)) return fail("Invalid board id.", 422);

  const role = await getBoardRole(boardId, user.id, user.role);
  if (!canEdit(role)) return fail("Forbidden.", 403);

  const body = await parseJson(request);
  const name = String(body.name || "").trim();
  const color = String(body.color || "").trim();

  if (!name) return fail("Name is required.", 422);
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return fail("Color must be a valid hex value.", 422);
  }

  const label = await prisma.label.create({
    data: {
      board_id: boardId,
      name,
      color,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return ok({ label: toLabel(label) }, 201);
}
