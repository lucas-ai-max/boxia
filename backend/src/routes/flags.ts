import { Router } from 'express';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userFlags } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { slugify, uniqueSlug } from '../lib/slugify.js';

export const flagsRouter = Router();
flagsRouter.use(requireAuth);

const upsertSchema = z.object({
  label: z.string().min(1).max(60),
  description: z.string().max(500).optional().nullable(),
});

flagsRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const rows = await db.select()
    .from(userFlags)
    .where(eq(userFlags.userId, userId))
    .orderBy(asc(userFlags.createdAt));
  res.json(rows);
}));

flagsRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const label = parsed.data.label.trim();
  const description = parsed.data.description?.trim() || null;

  const existing = await db.select({ slug: userFlags.slug })
    .from(userFlags)
    .where(eq(userFlags.userId, userId));
  const slug = uniqueSlug(slugify(label), new Set(existing.map((e) => e.slug)));

  const [row] = await db.insert(userFlags).values({
    userId, slug, label, description,
  }).returning();

  res.status(201).json(row);
}));

flagsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const id = req.params.id!;
  const existing = await db.query.userFlags.findFirst({
    where: and(eq(userFlags.id, id), eq(userFlags.userId, userId)),
  });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const update: Partial<{ label: string; description: string | null }> = {};
  if (parsed.data.label !== undefined) update.label = parsed.data.label.trim();
  if (parsed.data.description !== undefined) update.description = parsed.data.description?.trim() || null;

  const [row] = await db.update(userFlags)
    .set(update)
    .where(eq(userFlags.id, id))
    .returning();

  res.json(row);
}));

flagsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;
  const existing = await db.query.userFlags.findFirst({
    where: and(eq(userFlags.id, id), eq(userFlags.userId, userId)),
  });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  // Caixinhas antigas podem ainda ter o slug em flags jsonb — vira chave órfã (UI ignora).
  await db.delete(userFlags).where(eq(userFlags.id, id));
  res.status(204).end();
}));
