import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

function getBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function signAccessToken(user) {
  return new SignJWT({ sub: String(user.id), role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function requireUser(request) {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) return null;

    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        created_at: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireAdmin(request) {
  const user = await requireUser(request);
  if (!user || user.role !== "admin") return null;
  return user;
}
