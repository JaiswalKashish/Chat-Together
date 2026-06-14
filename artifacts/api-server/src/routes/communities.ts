import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, communitiesTable, communityMembersTable, collegesTable, usersTable, ridesTable, eventsTable } from "@workspace/db";
import { JoinCommunityParams, LeaveCommunityParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /communities — user's joined communities
router.get("/communities", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const memberships = await db
    .select({ communityId: communityMembersTable.communityId })
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  const memberCommunityIds = memberships.map((m) => m.communityId);

  const allCommunities = await db
    .select({ community: communitiesTable, college: collegesTable })
    .from(communitiesTable)
    .leftJoin(collegesTable, eq(communitiesTable.collegeId, collegesTable.id));

  const result = allCommunities
    .filter((row) => memberCommunityIds.includes(row.community.id))
    .map((row) => ({
      id: row.community.id,
      name: row.community.name,
      collegeId: row.community.collegeId,
      collegeName: row.college?.name ?? "",
      description: row.community.description ?? null,
      memberCount: row.community.memberCount,
      isJoined: true,
      createdAt: row.community.createdAt.toISOString(),
    }));

  res.json(result);
});

// GET /communities/all — all communities
router.get("/communities/all", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const memberships = await db
    .select({ communityId: communityMembersTable.communityId })
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  const memberCommunityIds = new Set(memberships.map((m) => m.communityId));

  const allCommunities = await db
    .select({ community: communitiesTable, college: collegesTable })
    .from(communitiesTable)
    .leftJoin(collegesTable, eq(communitiesTable.collegeId, collegesTable.id));

  res.json(
    allCommunities.map((row) => ({
      id: row.community.id,
      name: row.community.name,
      collegeId: row.community.collegeId,
      collegeName: row.college?.name ?? "",
      description: row.community.description ?? null,
      memberCount: row.community.memberCount,
      isJoined: memberCommunityIds.has(row.community.id),
      createdAt: row.community.createdAt.toISOString(),
    }))
  );
});

// GET /communities/:id — community detail
router.get("/communities/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const communityId = parseInt(rawId, 10);

  const [row] = await db
    .select({ community: communitiesTable, college: collegesTable })
    .from(communitiesTable)
    .leftJoin(collegesTable, eq(communitiesTable.collegeId, collegesTable.id))
    .where(eq(communitiesTable.id, communityId))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  const [membership] = await db
    .select()
    .from(communityMembersTable)
    .where(and(eq(communityMembersTable.communityId, communityId), eq(communityMembersTable.userId, userId)))
    .limit(1);

  // Count active members (joined in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const allMembers = await db
    .select()
    .from(communityMembersTable)
    .where(eq(communityMembersTable.communityId, communityId));

  const activeMembers = allMembers.filter((m) => m.joinedAt && m.joinedAt > thirtyDaysAgo).length;

  // Count upcoming events for this college
  const college = row.college;
  let upcomingEvents = 0;
  if (college) {
    const events = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.collegeId, college.id));
    const now = new Date().toISOString().split("T")[0];
    upcomingEvents = events.filter((e) => e.date >= now).length;
  }

  // Count rides from community members
  const memberIds = allMembers.map((m) => m.userId);
  let communityRides = 0;
  if (memberIds.length > 0) {
    const rides = await db
      .select()
      .from(ridesTable)
      .where(eq(ridesTable.status, "open"));
    communityRides = rides.filter((r) => memberIds.includes(r.offererId)).length;
  }

  res.json({
    id: row.community.id,
    name: row.community.name,
    collegeId: row.community.collegeId,
    collegeName: row.college?.name ?? "",
    description: row.community.description ?? null,
    memberCount: row.community.memberCount,
    activeMembers,
    upcomingEvents,
    communityRides,
    isJoined: !!membership,
    createdAt: row.community.createdAt.toISOString(),
  });
});

// GET /communities/:id/members
router.get("/communities/:id/members", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const communityId = parseInt(rawId, 10);

  const members = await db
    .select({ membership: communityMembersTable, user: usersTable })
    .from(communityMembersTable)
    .leftJoin(usersTable, eq(communityMembersTable.userId, usersTable.id))
    .where(eq(communityMembersTable.communityId, communityId));

  res.json(
    members
      .filter((m) => m.user)
      .map((m) => ({
        id: m.user!.id,
        fullName: m.user!.fullName,
        college: m.user!.college,
        department: m.user!.department,
        year: m.user!.year,
        profilePhotoUrl: m.user!.profilePhotoUrl ?? null,
        isVerified: m.user!.isVerified,
        reliabilityScore: 85,
        totalRides: 0,
        joinedAt: m.membership.joinedAt?.toISOString() ?? new Date().toISOString(),
      }))
  );
});

// POST /communities/:id/join
router.post("/communities/:id/join", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = JoinCommunityParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const communityId = params.data.id;

  const existing = await db
    .select()
    .from(communityMembersTable)
    .where(and(eq(communityMembersTable.communityId, communityId), eq(communityMembersTable.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    res.json({ message: "Already a member" });
    return;
  }

  await db.insert(communityMembersTable).values({ communityId, userId });

  const members = await db
    .select()
    .from(communityMembersTable)
    .where(eq(communityMembersTable.communityId, communityId));

  await db
    .update(communitiesTable)
    .set({ memberCount: members.length })
    .where(eq(communitiesTable.id, communityId));

  res.json({ message: "Joined community successfully" });
});

// POST /communities/:id/leave
router.post("/communities/:id/leave", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LeaveCommunityParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const communityId = params.data.id;

  await db
    .delete(communityMembersTable)
    .where(and(eq(communityMembersTable.communityId, communityId), eq(communityMembersTable.userId, userId)));

  res.json({ message: "Left community successfully" });
});

export default router;
