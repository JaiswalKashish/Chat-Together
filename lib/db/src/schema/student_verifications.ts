import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentVerificationsTable = pgTable("student_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  studentIdImageUrl: text("student_id_image_url").notNull(),
  extractedName: text("extracted_name"),
  extractedRollNumber: text("extracted_roll_number"),
  extractedCollege: text("extracted_college"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentVerificationSchema = createInsertSchema(studentVerificationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  extractedName: true,
  extractedRollNumber: true,
  extractedCollege: true,
  rejectionReason: true,
});

export type InsertStudentVerification = z.infer<typeof insertStudentVerificationSchema>;
export type StudentVerification = typeof studentVerificationsTable.$inferSelect;
