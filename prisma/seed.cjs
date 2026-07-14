const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BOARD_COLORS = {
  product: "#0079BF",
  marketing: "#519839",
};

async function ensureBoardMember(boardId, userId, role) {
  const now = new Date();
  await prisma.boardMember.upsert({
    where: {
      board_id_user_id: {
        board_id: boardId,
        user_id: userId,
      },
    },
    update: {
      role,
      updated_at: now,
    },
    create: {
      board_id: boardId,
      user_id: userId,
      role,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureLabel(boardId, name, color) {
  const existing = await prisma.label.findFirst({ where: { board_id: boardId, name } });
  const now = new Date();

  if (existing) {
    return prisma.label.update({
      where: { id: existing.id },
      data: { color, updated_at: now },
    });
  }

  return prisma.label.create({
    data: {
      board_id: boardId,
      name,
      color,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureList(boardId, title, position) {
  const existing = await prisma.boardList.findFirst({ where: { board_id: boardId, title } });
  const now = new Date();

  if (existing) {
    return prisma.boardList.update({
      where: { id: existing.id },
      data: { position, is_archived: false, updated_at: now },
    });
  }

  return prisma.boardList.create({
    data: {
      board_id: boardId,
      title,
      position,
      is_archived: false,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureCard(listId, cardData, position) {
  const existing = await prisma.card.findFirst({
    where: { list_id: listId, title: cardData.title },
  });
  const now = new Date();

  if (existing) {
    return prisma.card.update({
      where: { id: existing.id },
      data: {
        description: cardData.description,
        due_date: cardData.due_date || null,
        cover_color: cardData.cover_color || null,
        position,
        is_archived: false,
        updated_at: now,
      },
    });
  }

  return prisma.card.create({
    data: {
      list_id: listId,
      title: cardData.title,
      description: cardData.description,
      due_date: cardData.due_date || null,
      cover_color: cardData.cover_color || null,
      position,
      is_archived: false,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureCardLabel(cardId, labelId) {
  const now = new Date();
  await prisma.cardLabel.upsert({
    where: {
      card_id_label_id: {
        card_id: cardId,
        label_id: labelId,
      },
    },
    update: { updated_at: now },
    create: {
      card_id: cardId,
      label_id: labelId,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureCardMember(cardId, userId) {
  const now = new Date();
  await prisma.cardMember.upsert({
    where: {
      card_id_user_id: {
        card_id: cardId,
        user_id: userId,
      },
    },
    update: { updated_at: now },
    create: {
      card_id: cardId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    },
  });
}

async function ensureComment(cardId, userId, body) {
  const existing = await prisma.comment.findFirst({ where: { card_id: cardId, user_id: userId, body } });
  if (existing) return existing;

  const now = new Date();
  return prisma.comment.create({
    data: {
      card_id: cardId,
      user_id: userId,
      body,
      created_at: now,
      updated_at: now,
    },
  });
}

async function seedUsers() {
  const now = new Date();
  const passwordHash = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.upsert({
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

  const demoUser = await prisma.user.upsert({
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

  return { adminUser, demoUser };
}

async function seedBoardsAndCards(adminUser, demoUser) {
  const now = new Date();

  const productBoardTitle = "Product Roadmap";
  const marketingBoardTitle = "Marketing Sprint";

  const existingProductBoard = await prisma.board.findFirst({
    where: { user_id: demoUser.id, title: productBoardTitle },
  });
  const productBoard = existingProductBoard
    ? await prisma.board.update({
        where: { id: existingProductBoard.id },
        data: {
          description: "Plan upcoming features and releases",
          color: BOARD_COLORS.product,
          is_archived: false,
          updated_at: now,
        },
      })
    : await prisma.board.create({
        data: {
          user_id: demoUser.id,
          title: productBoardTitle,
          description: "Plan upcoming features and releases",
          color: BOARD_COLORS.product,
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
      });

  const existingMarketingBoard = await prisma.board.findFirst({
    where: { user_id: demoUser.id, title: marketingBoardTitle },
  });
  const marketingBoard = existingMarketingBoard
    ? await prisma.board.update({
        where: { id: existingMarketingBoard.id },
        data: {
          description: "Coordinate campaign tasks and content",
          color: BOARD_COLORS.marketing,
          is_archived: false,
          updated_at: now,
        },
      })
    : await prisma.board.create({
        data: {
          user_id: demoUser.id,
          title: marketingBoardTitle,
          description: "Coordinate campaign tasks and content",
          color: BOARD_COLORS.marketing,
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
      });

  await ensureBoardMember(productBoard.id, demoUser.id, "owner");
  await ensureBoardMember(productBoard.id, adminUser.id, "member");
  await ensureBoardMember(marketingBoard.id, demoUser.id, "owner");
  await ensureBoardMember(marketingBoard.id, adminUser.id, "viewer");

  const productBug = await ensureLabel(productBoard.id, "Bug", "#EB5A46");
  const productFeature = await ensureLabel(productBoard.id, "Feature", "#61BD4F");
  const productUrgent = await ensureLabel(productBoard.id, "Urgent", "#F2D600");

  const todoList = await ensureList(productBoard.id, "To Do", 0);
  const inProgressList = await ensureList(productBoard.id, "In Progress", 1);
  const doneList = await ensureList(productBoard.id, "Done", 2);

  const todoCard = await ensureCard(
    todoList.id,
    {
      title: "Design board activity timeline",
      description: "Add a timeline section in board view to display recent card actions.",
      due_date: null,
      cover_color: "#00AECC",
    },
    0
  );

  const progressCard = await ensureCard(
    inProgressList.id,
    {
      title: "Implement card archive endpoint",
      description: "Support archive/unarchive for cards and hide archived by default.",
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      cover_color: "#FF9F1A",
    },
    0
  );

  const doneCard = await ensureCard(
    doneList.id,
    {
      title: "Set up authentication guards",
      description: "Route guards should protect dashboard/admin routes.",
      due_date: null,
      cover_color: "#51E898",
    },
    0
  );

  await ensureCardLabel(todoCard.id, productFeature.id);
  await ensureCardLabel(progressCard.id, productBug.id);
  await ensureCardLabel(progressCard.id, productUrgent.id);
  await ensureCardLabel(doneCard.id, productFeature.id);

  await ensureCardMember(todoCard.id, demoUser.id);
  await ensureCardMember(progressCard.id, adminUser.id);
  await ensureCardMember(doneCard.id, demoUser.id);

  await ensureComment(progressCard.id, adminUser.id, "I can take this one after lunch.");
  await ensureComment(progressCard.id, demoUser.id, "Great, please also cover edge cases for archived lists.");

  const contentLabel = await ensureLabel(marketingBoard.id, "Content", "#0079BF");
  const seoLabel = await ensureLabel(marketingBoard.id, "SEO", "#C377E0");

  const backlogList = await ensureList(marketingBoard.id, "Backlog", 0);
  const doingList = await ensureList(marketingBoard.id, "Doing", 1);

  const backlogCard = await ensureCard(
    backlogList.id,
    {
      title: "Write July launch blog post",
      description: "Draft announcement with feature highlights and screenshots.",
      due_date: null,
      cover_color: null,
    },
    0
  );
  const doingCard = await ensureCard(
    doingList.id,
    {
      title: "Refresh homepage CTA copy",
      description: "A/B test concise vs detailed CTA text.",
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      cover_color: null,
    },
    0
  );

  await ensureCardLabel(backlogCard.id, contentLabel.id);
  await ensureCardLabel(doingCard.id, seoLabel.id);
  await ensureCardMember(backlogCard.id, demoUser.id);
  await ensureCardMember(doingCard.id, demoUser.id);
}

async function main() {
  const { adminUser, demoUser } = await seedUsers();
  await seedBoardsAndCards(adminUser, demoUser);
  console.log("Seed completed: users + sample boards/lists/cards are ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
