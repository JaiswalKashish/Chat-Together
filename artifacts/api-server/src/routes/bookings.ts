import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, rideBookingsTable, ridesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getIo } from "../lib/socket";

const router = Router();

// POST /bookings/:id/accept — driver accepts a booking request
router.post("/bookings/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const bookingId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [row] = await db
    .select({ booking: rideBookingsTable, ride: ridesTable })
    .from(rideBookingsTable)
    .leftJoin(ridesTable, eq(rideBookingsTable.rideId, ridesTable.id))
    .where(eq(rideBookingsTable.id, bookingId))
    .limit(1);

  if (!row || !row.ride || row.ride.offererId !== userId) {
    res.status(404).json({ error: "Booking not found or not your ride" });
    return;
  }

  if (row.booking.status !== "requested") {
    res.status(400).json({ error: "Booking is not in requested state" });
    return;
  }

  await db
    .update(rideBookingsTable)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(rideBookingsTable.id, bookingId));

  // Reduce available seats
  if (row.ride.seatsAvailable > 0) {
    await db
      .update(ridesTable)
      .set({ seatsAvailable: row.ride.seatsAvailable - 1 })
      .where(eq(ridesTable.id, row.ride.id));
  }

  try {
    const io = getIo();
    io.to(`user:${row.booking.passengerId}`).emit("bookingAccepted", {
      bookingId,
      rideId: row.booking.rideId,
      otp: row.booking.otp,
    });
  } catch (_) {}

  res.json({
    id: bookingId,
    rideId: row.booking.rideId,
    passengerId: row.booking.passengerId,
    passengerName: "",
    status: "accepted",
    pickupPoint: row.booking.pickupPoint,
    farePerSeat: row.booking.farePerSeat,
    otp: row.booking.otp,
    notes: row.booking.notes ?? null,
    createdAt: row.booking.createdAt.toISOString(),
  });
});

// POST /bookings/:id/reject
router.post("/bookings/:id/reject", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const bookingId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [row] = await db
    .select({ booking: rideBookingsTable, ride: ridesTable })
    .from(rideBookingsTable)
    .leftJoin(ridesTable, eq(rideBookingsTable.rideId, ridesTable.id))
    .where(eq(rideBookingsTable.id, bookingId))
    .limit(1);

  if (!row || !row.ride || row.ride.offererId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .update(rideBookingsTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(rideBookingsTable.id, bookingId));

  try {
    const io = getIo();
    io.to(`user:${row.booking.passengerId}`).emit("bookingRejected", {
      bookingId,
      rideId: row.booking.rideId,
    });
  } catch (_) {}

  res.json({ message: "Booking rejected" });
});

// POST /bookings/:id/verify-otp — driver verifies passenger OTP at pickup
router.post("/bookings/:id/verify-otp", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const bookingId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { otp } = req.body as { otp: string };

  const [row] = await db
    .select({ booking: rideBookingsTable, ride: ridesTable })
    .from(rideBookingsTable)
    .leftJoin(ridesTable, eq(rideBookingsTable.rideId, ridesTable.id))
    .where(eq(rideBookingsTable.id, bookingId))
    .limit(1);

  if (!row || !row.ride || row.ride.offererId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (row.booking.otp !== otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  await db
    .update(rideBookingsTable)
    .set({ status: "picked_up", updatedAt: new Date() })
    .where(eq(rideBookingsTable.id, bookingId));

  await db
    .update(ridesTable)
    .set({ status: "passenger_picked_up" })
    .where(eq(ridesTable.id, row.ride.id));

  try {
    const io = getIo();
    io.to(`ride:${row.ride.id}`).emit("passengerPickedUp", { bookingId, rideId: row.ride.id });
    io.to(`user:${row.booking.passengerId}`).emit("passengerPickedUp", { bookingId, rideId: row.ride.id });
  } catch (_) {}

  res.json({ message: "Passenger picked up. Ride started!" });
});

// POST /bookings/:id/complete
router.post("/bookings/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const bookingId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [row] = await db
    .select({ booking: rideBookingsTable, ride: ridesTable })
    .from(rideBookingsTable)
    .leftJoin(ridesTable, eq(rideBookingsTable.rideId, ridesTable.id))
    .where(eq(rideBookingsTable.id, bookingId))
    .limit(1);

  if (!row || !row.ride || row.ride.offererId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .update(rideBookingsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(rideBookingsTable.id, bookingId));

  // Check if all bookings for the ride are complete
  const allBookings = await db
    .select()
    .from(rideBookingsTable)
    .where(eq(rideBookingsTable.rideId, row.ride.id));

  const allDone = allBookings.every((b) => ["completed", "cancelled", "rejected"].includes(b.status));
  if (allDone) {
    await db.update(ridesTable).set({ status: "completed" }).where(eq(ridesTable.id, row.ride.id));
  }

  res.json({ message: "Ride completed" });
});

export default router;
