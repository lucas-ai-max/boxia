import { Router } from 'express';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCategories } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { slugify, uniqueSlug } from '../lib/slugify.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

const upsertSchema = z.object({
  label: z.string().min(1).max(60),
  description: z.string().max(500).optional().nullable(),
});

categoriesRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const rows = await db.select()
    .from(userCategories)
    .where(eq(userCategories.userId, userId))
    .orderBy(asc(userCategories.createdAt));
  res.json(rows);
}));

categoriesRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const label = parsed.data.label.trim();
  const description = parsed.data.description?.trim() || null;

  const existing = await db.select({ slug: userCategories.slug })
    .from(userCategories)
    .where(eq(userCategories.userId, userId));
  const slug = uniqueSlug(slugify(label), new Set(existing.map((e) => e.slug)));

  const [row] = await db.insert(userCategories).values({
    userId, slug, label, description,
  }).returning();

  res.status(201).json(row);
}));

categoriesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const id = req.params.id!;
  const existing = await db.query.userCategories.findFirst({
    where: and(eq(userCategories.id, id), eq(userCategories.userId, userId)),
  });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const update: Partial<{ label: string; description: string | null }> = {};
  if (parsed.data.label !== undefined) update.label = parsed.data.label.trim();
  if (parsed.data.description !== undefined) update.description = parsed.data.description?.trim() || null;

  // Slug NÃO é renomeado — caixinhas antigas referenciam por slug.
  const [row] = await db.update(userCategories)
    .set(update)
    .where(eq(userCategories.id, id))
    .returning();

  res.json(row);
}));

categoriesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;
  const existing = await db.query.userCategories.findFirst({
    where: and(eq(userCategories.id, id), eq(userCategories.userId, userId)),
  });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  // Caixinhas antigas mantêm a string da categoria — viram órfãs (UI mostra "sem categoria").
  await db.delete(userCategories).where(eq(userCategories.id, id));
  res.status(204).end();
}));
