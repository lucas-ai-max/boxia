import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { comparePassword, hashPassword, signToken, requireAuth } from '../lib/auth.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, displayName } = parsed.data;

  const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const [user] = await db.insert(users).values({
    email,
    passwordHash: await hashPassword(password),
    displayName: displayName ?? null,
  }).returning();

  const token = signToken({ userId: user!.id, email: user!.email });
  res.status(201).json({ token, user: { id: user!.id, email: user!.email, displayName: user!.displayName } });
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await comparePassword(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, email: user.email, displayName: user.displayName });
});
