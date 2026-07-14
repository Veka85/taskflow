import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { signAccessToken } from "@/lib/auth";
import { toUser } from "@/lib/serializers";

export async function POST(request) {
  const body = await parseJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail("Invalid credentials.", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return fail("Invalid credentials.", 401);

  const token = await signAccessToken(user);

  return ok({
    message: "Login successful.",
    user: toUser(user),
    token,
  });
}
