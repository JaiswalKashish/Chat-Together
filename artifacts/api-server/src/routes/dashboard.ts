import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, communityMembersTable, eventsTable, ridesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];

  const memberships = await db
    .select()
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = await db.select().from(eventsTable);
  const upcoming = upcomingEvents.filter((e) => e.date >= today);

  const rides = await db.select().from(ridesTable).where(eq(ridesTable.offererId, userId));
  const activeRides = rides.filter((r) => r.status === "active");

  let verificationStatus: "incomplete" | "pending" | "verified" = "incomplete";
  if (user) {
    if (user.isVerified) {
      verificationStatus = "verified";
    } else if (user.emailVerified || user.phoneVerified || user.studentIdVerified) {
      verificationStatus = "pending";
    }
  }

  res.json({
    communitiesJoined: memberships.length,
    upcomingEvents: upcoming.length,
    activeRides: activeRides.length,
    verificationStatus,
    totalCommunityMembers: 0,
  });
});

export default router;
