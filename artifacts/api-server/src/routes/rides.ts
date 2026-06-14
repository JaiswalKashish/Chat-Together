import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ridesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /rides
router.get("/rides", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({ ride: ridesTable, offerer: usersTable })
    .from(ridesTable)
    .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
    .orderBy(ridesTable.createdAt);

  res.json(
    rows.map((row) => ({
      id: row.ride.id,
      offererId: row.ride.offererId,
      offererName: row.offerer?.fullName ?? "Unknown",
      status: row.ride.status,
      origin: row.ride.origin,
      destination: row.ride.destination,
      date: row.ride.date,
      seatsAvailable: row.ride.seatsAvailable,
      eventId: row.ride.eventId ?? null,
      createdAt: row.ride.createdAt.toISOString(),
    }))
  );
});

export default router;
