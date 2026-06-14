import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, collegesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /events
router.get("/events", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ event: eventsTable, college: collegesTable })
    .from(eventsTable)
    .leftJoin(collegesTable, eq(eventsTable.collegeId, collegesTable.id))
    .orderBy(eventsTable.date);

  res.json(
    rows.map((row) => ({
      id: row.event.id,
      title: row.event.title,
      description: row.event.description ?? null,
      type: row.event.type,
      date: row.event.date,
      venue: row.event.venue ?? null,
      collegeId: row.event.collegeId,
      collegeName: row.college?.name ?? "",
      ridePoolCount: row.event.ridePoolCount,
      createdAt: row.event.createdAt.toISOString(),
    }))
  );
});

export default router;
