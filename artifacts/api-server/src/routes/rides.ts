import { Router } from "express";
import { eq, and, ne, or, gte } from "drizzle-orm";
import { db, ridesTable, usersTable, rideBookingsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getIo } from "../lib/socket";
import crypto from "crypto";

const router = Router();

function rideToDetail(ride: typeof ridesTable.$inferSelect, offerer: typeof usersTable.$inferSelect | null) {
  return {
    id: ride.id,
    offererId: ride.offererId,
    offererName: offerer?.fullName ?? "Unknown",
    offererCollege: offerer?.college ?? "",
    offererVerified: offerer?.isVerified ?? false,
    offererReliabilityScore: 85,
    status: ride.status,
    origin: ride.origin,
    destination: ride.destination,
    waypoints: ride.waypoints ?? [],
    date: ride.date,
    time: ride.time,
    vehicleType: ride.vehicleType,
    vehicleNumber: ride.vehicleNumber,
    fuelType: ride.fuelType,
    totalSeats: ride.totalSeats,
    seatsAvailable: ride.seatsAvailable,
    farePerSeat: ride.farePerSeat,
    isRecurring: ride.isRecurring,
    notes: ride.notes ?? null,
    currentLat: ride.currentLat ?? null,
    currentLng: ride.currentLng ?? null,
    trackingToken: ride.trackingToken ?? null,
    createdAt: ride.createdAt.toISOString(),
  };
}

function computeMatchScore(
  ride: typeof ridesTable.$inferSelect,
  searchOrigin?: string,
  searchDest?: string,
  searchTime?: string
): { score: number; breakdown: { destinationMatch: number; routeOverlap: number; timeMatch: number; pickupDistance: number; driverRating: number } } {
  let destinationMatch = 0;
  let routeOverlap = 0;
  let timeMatch = 0;
  let pickupDistance = 15;
  const driverRating = 5;

  const normalize = (s: string) => s.toLowerCase().trim();

  if (searchDest) {
    const ridePoints = [ride.origin, ...(ride.waypoints ?? []), ride.destination].map(normalize);
    const dest = normalize(searchDest);
    if (ridePoints[ridePoints.length - 1] === dest) {
      destinationMatch = 10;
    } else if (ridePoints.some((p) => p.includes(dest) || dest.includes(p))) {
      destinationMatch = 6;
    }
  } else {
    destinationMatch = 7;
  }

  if (searchOrigin) {
    const ridePoints = [ride.origin, ...(ride.waypoints ?? []), ride.destination].map(normalize);
    const orig = normalize(searchOrigin);
    if (ridePoints.some((p) => p.includes(orig) || orig.includes(p))) {
      routeOverlap = 40;
    } else {
      routeOverlap = 15;
    }
  } else {
    routeOverlap = 25;
  }

  if (searchTime && ride.time) {
    const [sh, sm] = searchTime.split(":").map(Number);
    const [rh, rm] = ride.time.split(":").map(Number);
    const diffMins = Math.abs((sh * 60 + sm) - (rh * 60 + rm));
    if (diffMins <= 15) timeMatch = 30;
    else if (diffMins <= 30) timeMatch = 20;
    else if (diffMins <= 60) timeMatch = 10;
    else timeMatch = 2;
  } else {
    timeMatch = 20;
  }

  const score = destinationMatch + routeOverlap + timeMatch + pickupDistance + driverRating;
  return { score, breakdown: { destinationMatch, routeOverlap, timeMatch, pickupDistance, driverRating } };
}

// POST /rides/create
router.post("/rides/create", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const {
    origin, destination, waypoints, date, time,
    vehicleType, vehicleNumber, fuelType, mileage,
    totalSeats, farePerSeat, isRecurring, recurringDays, eventId, notes,
  } = req.body as {
    origin: string; destination: string; waypoints?: string[]; date: string; time: string;
    vehicleType: string; vehicleNumber: string; fuelType: string; mileage: number;
    totalSeats: number; farePerSeat: number; isRecurring?: boolean; recurringDays?: string[];
    eventId?: number | null; notes?: string | null;
  };

  if (!origin || !destination || !date || !time || !vehicleType || !vehicleNumber) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const trackingToken = crypto.randomBytes(16).toString("hex");

  const [ride] = await db
    .insert(ridesTable)
    .values({
      offererId: userId,
      origin,
      destination,
      waypoints: waypoints ?? [],
      date,
      time,
      vehicleType,
      vehicleNumber,
      fuelType: fuelType ?? "petrol",
      mileage: mileage ?? 15,
      totalSeats: totalSeats ?? 3,
      seatsAvailable: totalSeats ?? 3,
      farePerSeat: farePerSeat ?? 0,
      isRecurring: isRecurring ?? false,
      recurringDays: recurringDays ?? [],
      eventId: eventId ?? null,
      notes: notes ?? null,
      status: "open",
      trackingToken,
    })
    .returning();

  const [offerer] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  // Broadcast new ride to all connected clients
  try {
    const io = getIo();
    io.emit("newRide", rideToDetail(ride, offerer ?? null));
  } catch (_) {}

  res.status(201).json(rideToDetail(ride, offerer ?? null));
});

// GET /rides/search
router.get("/rides/search", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const { origin, destination, date, time } = req.query as {
    origin?: string; destination?: string; date?: string; time?: string;
  };

  const rows = await db
    .select({ ride: ridesTable, offerer: usersTable })
    .from(ridesTable)
    .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
    .where(
      and(
        ne(ridesTable.offererId, userId),
        ne(ridesTable.status, "cancelled"),
        ne(ridesTable.status, "completed"),
      )
    );

  const filtered = date
    ? rows.filter((r) => r.ride.date === date)
    : rows;

  const results = filtered
    .map((row) => {
      const { score, breakdown } = computeMatchScore(row.ride, origin, destination, time);
      return {
        ride: rideToDetail(row.ride, row.offerer),
        matchScore: Math.min(score, 100),
        matchBreakdown: breakdown,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json(results);
});

// GET /rides/my
router.get("/rides/my", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const [offererRows, userRow, bookingRows] = await Promise.all([
    db.select({ ride: ridesTable, offerer: usersTable })
      .from(ridesTable)
      .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
      .where(eq(ridesTable.offererId, userId)),
    db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
    db.select({ booking: rideBookingsTable, ride: ridesTable, offerer: usersTable })
      .from(rideBookingsTable)
      .leftJoin(ridesTable, eq(rideBookingsTable.rideId, ridesTable.id))
      .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
      .where(eq(rideBookingsTable.passengerId, userId)),
  ]);

  const offered = offererRows
    .filter((r) => !["completed", "cancelled"].includes(r.ride.status))
    .map((r) => rideToDetail(r.ride, r.offerer));

  const completed = offererRows
    .filter((r) => r.ride.status === "completed")
    .map((r) => rideToDetail(r.ride, r.offerer));

  const cancelled = offererRows
    .filter((r) => r.ride.status === "cancelled")
    .map((r) => rideToDetail(r.ride, r.offerer));

  const me = userRow[0];
  const booked = bookingRows
    .filter((r) => r.ride && !["completed", "cancelled"].includes(r.booking.status))
    .map((r) => ({
      booking: {
        id: r.booking.id,
        rideId: r.booking.rideId,
        passengerId: r.booking.passengerId,
        passengerName: me?.fullName ?? "Me",
        status: r.booking.status,
        pickupPoint: r.booking.pickupPoint,
        farePerSeat: r.booking.farePerSeat,
        otp: r.booking.otp,
        notes: r.booking.notes ?? null,
        createdAt: r.booking.createdAt.toISOString(),
      },
      ride: rideToDetail(r.ride!, r.offerer),
    }));

  res.json({ offered, booked, completed, cancelled });
});

// GET /rides/:id
router.get("/rides/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ride id" });
    return;
  }

  const [row] = await db
    .select({ ride: ridesTable, offerer: usersTable })
    .from(ridesTable)
    .leftJoin(usersTable, eq(ridesTable.offererId, usersTable.id))
    .where(eq(ridesTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }

  res.json(rideToDetail(row.ride, row.offerer));
});

// POST /rides/:id/book
router.post("/rides/:id/book", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rideId = parseInt(rawId, 10);
  const { pickupPoint, notes } = req.body as { pickupPoint: string; notes?: string };

  if (!pickupPoint) {
    res.status(400).json({ error: "pickupPoint is required" });
    return;
  }

  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, rideId)).limit(1);
  if (!ride) {
    res.status(404).json({ error: "Ride not found" });
    return;
  }
  if (ride.offererId === userId) {
    res.status(400).json({ error: "Cannot book your own ride" });
    return;
  }
  if (ride.seatsAvailable <= 0) {
    res.status(400).json({ error: "No seats available" });
    return;
  }

  const existing = await db
    .select()
    .from(rideBookingsTable)
    .where(and(eq(rideBookingsTable.rideId, rideId), eq(rideBookingsTable.passengerId, userId)))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "You have already booked this ride" });
    return;
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const [booking] = await db
    .insert(rideBookingsTable)
    .values({
      rideId,
      passengerId: userId,
      pickupPoint,
      farePerSeat: ride.farePerSeat,
      otp,
      notes: notes ?? null,
      status: "requested",
    })
    .returning();

  const [passenger] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  // Notify driver
  try {
    const io = getIo();
    io.to(`user:${ride.offererId}`).emit("newBookingRequest", {
      bookingId: booking.id,
      rideId,
      passengerName: passenger?.fullName ?? "Someone",
      pickupPoint,
    });
  } catch (_) {}

  res.status(201).json({
    id: booking.id,
    rideId: booking.rideId,
    passengerId: booking.passengerId,
    passengerName: passenger?.fullName ?? "Me",
    status: booking.status,
    pickupPoint: booking.pickupPoint,
    farePerSeat: booking.farePerSeat,
    otp: booking.otp,
    notes: booking.notes ?? null,
    createdAt: booking.createdAt.toISOString(),
  });
});

// GET /rides/:id/bookings — driver sees all requests
router.get("/rides/:id/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rideId = parseInt(rawId, 10);

  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, rideId)).limit(1);
  if (!ride || ride.offererId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const bookings = await db
    .select({ booking: rideBookingsTable, passenger: usersTable })
    .from(rideBookingsTable)
    .leftJoin(usersTable, eq(rideBookingsTable.passengerId, usersTable.id))
    .where(eq(rideBookingsTable.rideId, rideId));

  res.json(
    bookings.map(({ booking, passenger }) => ({
      id: booking.id,
      rideId: booking.rideId,
      passengerId: booking.passengerId,
      passengerName: passenger?.fullName ?? "Unknown",
      passengerCollege: passenger?.college ?? "",
      passengerVerified: passenger?.isVerified ?? false,
      passengerReliabilityScore: 85,
      passengerPhoto: passenger?.profilePhotoUrl ?? null,
      status: booking.status,
      pickupPoint: booking.pickupPoint,
      farePerSeat: booking.farePerSeat,
      otp: booking.otp,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt.toISOString(),
    }))
  );
});

// POST /rides/:id/cancel
router.post("/rides/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rideId = parseInt(rawId, 10);

  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, rideId)).limit(1);
  if (!ride || ride.offererId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(ridesTable).set({ status: "cancelled" }).where(eq(ridesTable.id, rideId));
  res.json({ message: "Ride cancelled" });
});

// POST /rides/:id/location — driver updates live location
router.post("/rides/:id/location", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rideId = parseInt(rawId, 10);
  const { lat, lng } = req.body as { lat: number; lng: number };

  const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, rideId)).limit(1);
  if (!ride || ride.offererId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(ridesTable).set({ currentLat: lat, currentLng: lng }).where(eq(ridesTable.id, rideId));

  try {
    const io = getIo();
    io.to(`ride:${rideId}`).emit("locationUpdate", { rideId, lat, lng });
    if (ride.trackingToken) {
      io.to(`track:${ride.trackingToken}`).emit("locationUpdate", { rideId, lat, lng });
    }
  } catch (_) {}

  res.json({ message: "Location updated" });
});

export default router;
