import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";
import { toUser } from "@/lib/serializers";

export async function GET(request) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);
  return ok({ user: toUser(user) });
}
