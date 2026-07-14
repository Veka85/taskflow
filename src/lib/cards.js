import { prisma } from "@/lib/prisma";

export async function normalizeCardPositions(listId) {
  const cards = await prisma.card.findMany({
    where: { list_id: Number(listId) },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  await Promise.all(
    cards.map((card, index) => prisma.card.update({ where: { id: card.id }, data: { position: index } }))
  );
}
