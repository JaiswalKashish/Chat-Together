import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterUserBody,
  LoginUserBody,
  VerifyEmailBody,
  ResendVerificationBody,
  SendPhoneOtpBody,
  VerifyPhoneBody,
} from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken, requireAuth, generateOtp, generateToken } from "../lib/auth";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, college, department, year, email, phone, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = generateToken();
  const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [user] = await db.insert(usersTable).values({
    fullName,
    college,
    department,
    year,
    email,
    phone,
    passwordHash,
    emailVerificationToken,
    emailVerificationExpiry,
  }).returning();

  const token = signToken(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      college: user.college,
      department: user.department,
      year: user.year,
      profilePhotoUrl: user.profilePhotoUrl ?? null,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      studentIdVerified: user.studentIdVerified,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { identifier, password } = parsed.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, identifier), eq(usersTable.phone, identifier)))
    .limit(1);

  if (users.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = users[0];
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      college: user.college,
      department: user.department,
      year: user.year,
      profilePhotoUrl: user.profilePhotoUrl ?? null,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      studentIdVerified: user.studentIdVerified,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  res.sendStatus(204);
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (users.length === 0) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = users[0];
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    college: user.college,
    department: user.department,
    year: user.year,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    studentIdVerified: user.studentIdVerified,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  });
});

// POST /auth/verify-email
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const parsed = VerifyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { token } = parsed.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.emailVerificationToken, token))
    .limit(1);

  if (users.length === 0) {
    res.status(400).json({ error: "Invalid verification token" });
    return;
  }

  const user = users[0];
  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    res.status(400).json({ error: "Verification token has expired" });
    return;
  }

  const isVerified = user.phoneVerified && user.studentIdVerified;
  await db
    .update(usersTable)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      isVerified,
    })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true, message: "Email verified successfully" });
});

// POST /auth/resend-verification
router.post("/auth/resend-verification", async (req, res): Promise<void> => {
  const parsed = ResendVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (users.length === 0) {
    res.json({ message: "If this email exists, a verification email has been sent" });
    return;
  }

  const newToken = generateToken();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ emailVerificationToken: newToken, emailVerificationExpiry: expiry })
    .where(eq(usersTable.email, email));

  // Demo mode: return the token directly since no email service is configured
  res.json({ message: "Verification code generated (demo mode — no email service configured)", demoToken: newToken });
});

// POST /auth/send-phone-otp
router.post("/auth/send-phone-otp", async (req, res): Promise<void> => {
  const parsed = SendPhoneOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phone } = parsed.data;
  const otp = generateOtp();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ phoneOtp: otp, phoneOtpExpiry: expiry })
    .where(eq(usersTable.phone, phone));

  req.log.info({ phone: phone.slice(-4) }, "OTP generated (demo mode)");
  // Demo mode: return the OTP directly since no SMS service is configured
  res.json({ message: `OTP generated (demo mode — no SMS service configured)`, demoOtp: otp });
});

// POST /auth/verify-phone
router.post("/auth/verify-phone", async (req, res): Promise<void> => {
  const parsed = VerifyPhoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { phone, otp } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (users.length === 0) {
    res.status(400).json({ error: "Phone number not found" });
    return;
  }

  const user = users[0];
  if (!user.phoneOtp || user.phoneOtp !== otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  if (user.phoneOtpExpiry && user.phoneOtpExpiry < new Date()) {
    res.status(400).json({ error: "OTP has expired" });
    return;
  }

  const isVerified = user.emailVerified && user.studentIdVerified;
  await db
    .update(usersTable)
    .set({ phoneVerified: true, phoneOtp: null, isVerified })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true, message: "Phone verified successfully" });
});

export default router;
