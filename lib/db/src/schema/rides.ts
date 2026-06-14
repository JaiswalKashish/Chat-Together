import { pgTable, text, serial, timestamp, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ridesTable = pgTable("rides", {
  id: serial("id").primaryKey(),
  offererId: integer("offerer_id").notNull(),
  status: text("status").notNull().default("open"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  waypoints: text("waypoints").array().notNull().default([]),
  date: text("date").notNull(),
  time: text("time").notNull().default("08:00"),
  vehicleType: text("vehicle_type").notNull().default("car"),
  vehicleNumber: text("vehicle_number").notNull().default(""),
  fuelType: text("fuel_type").notNull().default("petrol"),
  mileage: real("mileage").notNull().default(15),
  totalSeats: integer("total_seats").notNull().default(3),
  seatsAvailable: integer("seats_available").notNull().default(3),
  farePerSeat: real("fare_per_seat").notNull().default(0),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringDays: text("recurring_days").array().notNull().default([]),
  notes: text("notes"),
  eventId: integer("event_id"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  trackingToken: text("tracking_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideSchema = createInsertSchema(ridesTable, {
  waypoints: z.array(z.string()).optional(),
  recurringDays: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  status: true,
  seatsAvailable: true,
  currentLat: true,
  currentLng: true,
  trackingToken: true,
});

export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof ridesTable.$inferSelect;
