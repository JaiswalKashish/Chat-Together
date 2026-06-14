import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trustedContactsTable = pgTable("trusted_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull().default("other"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrustedContactSchema = createInsertSchema(trustedContactsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTrustedContact = z.infer<typeof insertTrustedContactSchema>;
export type TrustedContact = typeof trustedContactsTable.$inferSelect;
