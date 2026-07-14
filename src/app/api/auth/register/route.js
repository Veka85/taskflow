import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { signAccessToken } from "@/lib/auth";
import { toUser } from "@/lib/serializers";

export async function POST(request) {
  const body = await parseJson(request);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const passwordConfirmation = String(body.password_confirmation || "");

  const fieldErrors = {};
  if (!name) fieldErrors.name = ["Name is required."];
  if (!email || !email.includes("@")) fieldErrors.email = ["A valid email is required."];
  if (password.length < 8) fieldErrors.password = ["Password must be at least 8 characters."];
  if (password !== passwordConfirmation) fieldErrors.password_confirmation = ["Passwords do not match."];

  if (Object.keys(fieldErrors).length > 0) {
    return fail("Validation failed.", 422, { errors: fieldErrors });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail("The email has already been taken.", 422, { errors: { email: ["The email has already been taken."] } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: "user",
      created_at: now,
      updated_at: now,
    },
  });

  const token = await signAccessToken(user);

  return ok({
    message: "Registration successful.",
    user: toUser(user),
    token,
  }, 201);
}
