import { Router } from "express";
import { eq, or, and, desc } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getIo } from "../lib/socket";

const router = Router();

// GET /chat/conversations — list unique conversations
router.get("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderId, userId),
        eq(messagesTable.receiverId, userId)
      )
    )
    .orderBy(desc(messagesTable.createdAt));

  // Build unique conversations by other party
  const seen = new Map<number, typeof messagesTable.$inferSelect>();
  for (const msg of messages) {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!seen.has(otherId)) seen.set(otherId, msg);
  }

  const userIds = Array.from(seen.keys());
  if (userIds.length === 0) {
    res.json([]);
    return;
  }

  const otherUsers = await db
    .select()
    .from(usersTable)
    .where(or(...userIds.map((id) => eq(usersTable.id, id))));

  const unreadCounts = new Map<number, number>();
  for (const msg of messages) {
    if (msg.receiverId === userId && !msg.isRead) {
      unreadCounts.set(msg.senderId, (unreadCounts.get(msg.senderId) ?? 0) + 1);
    }
  }

  const conversations = otherUsers.map((u) => {
    const lastMsg = seen.get(u.id)!;
    return {
      userId: u.id,
      userName: u.fullName,
      userCollege: u.college,
      userPhoto: u.profilePhotoUrl ?? null,
      isVerified: u.isVerified,
      lastMessage: lastMsg.content,
      unreadCount: unreadCounts.get(u.id) ?? 0,
      updatedAt: lastMsg.createdAt.toISOString(),
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json(conversations);
});

// GET /chat/messages?userId=X
router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const otherId = parseInt(String(req.query.userId), 10);

  if (isNaN(otherId)) {
    res.status(400).json({ error: "userId query param required" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, otherId)),
        and(eq(messagesTable.senderId, otherId), eq(messagesTable.receiverId, userId))
      )
    )
    .orderBy(messagesTable.createdAt);

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId)).limit(1);

  res.json(
    messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderId === userId ? (sender?.fullName ?? "Me") : (other?.fullName ?? "Unknown"),
      receiverId: m.receiverId,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

// POST /chat/send
router.post("/chat/send", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { receiverId, content } = req.body as { receiverId: number; content: string };

  if (!receiverId || !content?.trim()) {
    res.status(400).json({ error: "receiverId and content are required" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ senderId: userId, receiverId, content: content.trim() })
    .returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const payload = {
    id: msg.id,
    senderId: msg.senderId,
    senderName: sender?.fullName ?? "Unknown",
    receiverId: msg.receiverId,
    content: msg.content,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  };

  try {
    const io = getIo();
    io.to(`user:${receiverId}`).emit("newMessage", payload);
  } catch (_) {}

  res.status(201).json(payload);
});

// POST /chat/read — mark messages from sender as read
router.post("/chat/read", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { senderId } = req.body as { senderId: number };

  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.senderId, senderId),
        eq(messagesTable.receiverId, userId)
      )
    );

  res.json({ message: "Marked as read" });
});

export default router;
