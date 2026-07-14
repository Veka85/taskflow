const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedUsers() {
  const now = new Date();
  const passwordHash = await bcrypt.hash("password", 10);

  await prisma.user.upsert({
    where: { email: "admin@taskflow.com" },
    update: {
      name: "Admin User",
      role: "admin",
      password: passwordHash,
      updated_at: now,
    },
    create: {
      name: "Admin User",
      email: "admin@taskflow.com",
      password: passwordHash,
      role: "admin",
      created_at: now,
      updated_at: now,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@taskflow.com" },
    update: {
      name: "Demo User",
      role: "user",
      password: passwordHash,
      updated_at: now,
    },
    create: {
      name: "Demo User",
      email: "demo@taskflow.com",
      password: passwordHash,
      role: "user",
      created_at: now,
      updated_at: now,
    },
  });
}

async function main() {
  await seedUsers();
  console.log("Seed completed: admin@taskflow.com and demo@taskflow.com are ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
