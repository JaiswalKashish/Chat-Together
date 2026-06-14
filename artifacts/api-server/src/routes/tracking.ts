import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ridesTable, usersTable } from "@workspace/db";

const router = Router();

// GET /trips/:token — public, no auth required
router.get("/trips/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  const [row] = await db
    .select({ ride: ridesTable, offerer: usersTable })
    .from(ridesTable)
    .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
    .where(eq(ridesTable.trackingToken, token))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const { ride, offerer } = row;

  res.json({
    rideId: ride.id,
    driverName: offerer?.fullName ?? "Driver",
    vehicleType: ride.vehicleType,
    vehicleNumber: ride.vehicleNumber,
    origin: ride.origin,
    destination: ride.destination,
    status: ride.status,
    currentLat: ride.currentLat ?? null,
    currentLng: ride.currentLng ?? null,
    eta: null,
    createdAt: ride.createdAt.toISOString(),
  });
});

export default router;
