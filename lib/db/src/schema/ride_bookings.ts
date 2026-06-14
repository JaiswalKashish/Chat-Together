import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rideBookingsTable = pgTable("ride_bookings", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull(),
  passengerId: integer("passenger_id").notNull(),
  status: text("status").notNull().default("requested"),
  pickupPoint: text("pickup_point").notNull(),
  farePerSeat: real("fare_per_seat").notNull().default(0),
  otp: text("otp").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideBookingSchema = createInsertSchema(rideBookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  otp: true,
  farePerSeat: true,
});

export type InsertRideBooking = z.infer<typeof insertRideBookingSchema>;
export type RideBooking = typeof rideBookingsTable.$inferSelect;
