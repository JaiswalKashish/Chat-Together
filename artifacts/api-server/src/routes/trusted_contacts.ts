import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, trustedContactsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /trusted-contacts
router.get("/trusted-contacts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const contacts = await db
    .select()
    .from(trustedContactsTable)
    .where(eq(trustedContactsTable.userId, userId))
    .orderBy(trustedContactsTable.createdAt);

  res.json(
    contacts.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

// POST /trusted-contacts
router.post("/trusted-contacts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { name, phone, relationship } = req.body as { name: string; phone: string; relationship: string };

  if (!name || !phone || !relationship) {
    res.status(400).json({ error: "name, phone, and relationship are required" });
    return;
  }

  const [contact] = await db
    .insert(trustedContactsTable)
    .values({ userId, name, phone, relationship })
    .returning();

  res.status(201).json({
    id: contact.id,
    userId: contact.userId,
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
    createdAt: contact.createdAt.toISOString(),
  });
});

// DELETE /trusted-contacts/:id
router.delete("/trusted-contacts/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const contactId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  await db
    .delete(trustedContactsTable)
    .where(and(eq(trustedContactsTable.id, contactId), eq(trustedContactsTable.userId, userId)));

  res.json({ message: "Contact deleted" });
});

export default router;
