import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateMyProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /users/me
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (users.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[0];
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    college: user.college,
    department: user.department,
    year: user.year,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    studentIdVerified: user.studentIdVerified,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  });
});

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.fullName != null) updateData.fullName = parsed.data.fullName;
  if (parsed.data.department != null) updateData.department = parsed.data.department;
  if (parsed.data.year != null) updateData.year = parsed.data.year;
  if (parsed.data.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = parsed.data.profilePhotoUrl;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    college: user.college,
    department: user.department,
    year: user.year,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    studentIdVerified: user.studentIdVerified,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
