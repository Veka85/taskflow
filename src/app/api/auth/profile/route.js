import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJson } from "@/lib/http";
import { toUser } from "@/lib/serializers";

export async function PUT(request) {
  const currentUser = await requireUser(request);
  if (!currentUser) return fail("Unauthenticated.", 401);

  const body = await parseJson(request);
  const updates = {};
  const errors = {};

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) errors.name = ["Name is required."];
    else updates.name = name;
  }

  if (body.email !== undefined) {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      errors.email = ["A valid email is required."];
    } else {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== currentUser.id) {
        errors.email = ["The email has already been taken."];
      } else {
        updates.email = email;
      }
    }
  }

  if (body.password !== undefined && String(body.password).length > 0) {
    const password = String(body.password);
    const passwordConfirmation = String(body.password_confirmation || "");
    if (password.length < 8) errors.password = ["Password must be at least 8 characters."];
    if (password !== passwordConfirmation) errors.password_confirmation = ["Passwords do not match."];
    if (!errors.password && !errors.password_confirmation) {
      updates.password = await bcrypt.hash(password, 10);
    }
  }

  if (Object.keys(errors).length > 0) {
    return fail("Validation failed.", 422, { errors });
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { ...updates, updated_at: new Date() },
  });

  return ok({
    message: "Profile updated successfully.",
    user: toUser(user),
  });
}
