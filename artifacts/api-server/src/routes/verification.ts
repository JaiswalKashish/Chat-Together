import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, studentVerificationsTable } from "@workspace/db";
import { SubmitStudentIdBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

// POST /verification/student-id
router.post("/verification/student-id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = SubmitStudentIdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { studentIdImageUrl, college } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[0];
  if (user.college.toLowerCase() !== college.toLowerCase()) {
    res.status(400).json({ error: "College verification failed. Please upload a valid student ID card." });
    return;
  }

  const [verification] = await db
    .insert(studentVerificationsTable)
    .values({
      userId,
      studentIdImageUrl,
    })
    .returning();

  await db
    .update(usersTable)
    .set({ studentIdVerified: true, isVerified: user.emailVerified && user.phoneVerified })
    .where(eq(usersTable.id, userId));

  res.json({
    id: verification.id,
    userId: verification.userId,
    status: verification.status,
    studentIdImageUrl: verification.studentIdImageUrl,
    extractedName: verification.extractedName ?? null,
    extractedRollNumber: verification.extractedRollNumber ?? null,
    extractedCollege: verification.extractedCollege ?? null,
    rejectionReason: verification.rejectionReason ?? null,
    createdAt: verification.createdAt.toISOString(),
  });
});

// GET /verification/status
router.get("/verification/status", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const verifications = await db
    .select()
    .from(studentVerificationsTable)
    .where(eq(studentVerificationsTable.userId, userId))
    .orderBy(studentVerificationsTable.createdAt)
    .limit(1);

  if (verifications.length === 0) {
    res.json({
      id: 0,
      userId,
      status: "pending",
      studentIdImageUrl: "",
      extractedName: null,
      extractedRollNumber: null,
      extractedCollege: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const v = verifications[0];
  res.json({
    id: v.id,
    userId: v.userId,
    status: v.status,
    studentIdImageUrl: v.studentIdImageUrl,
    extractedName: v.extractedName ?? null,
    extractedRollNumber: v.extractedRollNumber ?? null,
    extractedCollege: v.extractedCollege ?? null,
    rejectionReason: v.rejectionReason ?? null,
    createdAt: v.createdAt.toISOString(),
  });
});

export default router;
