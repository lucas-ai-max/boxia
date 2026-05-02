import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { brandDna } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';

export const brandDnaRouter = Router();
brandDnaRouter.use(requireAuth);

brandDnaRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const rows = await db.query.brandDna.findMany({
    where: eq(brandDna.userId, userId),
    orderBy: [desc(brandDna.version)],
  });
  res.json({ active: rows.find((r) => r.active) ?? rows[0] ?? null, versions: rows });
});

brandDnaRouter.put('/', async (req, res) => {
  const parsed = z.object({
    contentText: z.string().min(1).max(20000),
    examples: z.array(z.string().max(500)).max(5).default([]),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const last = await db.query.brandDna.findFirst({
    where: eq(brandDna.userId, userId),
    orderBy: [desc(brandDna.version)],
  });
  const nextVersion = (last?.version ?? 0) + 1;

  await db.update(brandDna).set({ active: false }).where(and(eq(brandDna.userId, userId), eq(brandDna.active, true)));

  const [row] = await db.insert(brandDna).values({
    userId,
    version: nextVersion,
    contentText: parsed.data.contentText,
    examples: parsed.data.examples,
    active: true,
  }).returning();
  res.json(row);
});
