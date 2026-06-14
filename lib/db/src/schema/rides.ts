import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ridesTable = pgTable("rides", {
  id: serial("id").primaryKey(),
  offererId: integer("offerer_id").notNull(),
  status: text("status").notNull().default("active"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  date: text("date").notNull(),
  seatsAvailable: integer("seats_available").notNull().default(3),
  eventId: integer("event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideSchema = createInsertSchema(ridesTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof ridesTable.$inferSelect;
