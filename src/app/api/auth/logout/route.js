import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return fail("Unauthenticated.", 401);
  return ok({ message: "Logged out successfully." });
}
