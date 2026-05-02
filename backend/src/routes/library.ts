import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { historicalQa } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { storage } from '../lib/storage.js';
import { llm } from '../services/gemini-provider.js';
import { addToRag } from '../services/rag.js';
import { env } from '../config/env.js';

export const libraryRouter = Router();
libraryRouter.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_VIDEO_MB * 1024 * 1024 } });

libraryRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const q = (req.query.q as string | undefined)?.trim();
  const filter = q
    ? and(eq(historicalQa.userId, userId), or(ilike(historicalQa.question, `%${q}%`), ilike(historicalQa.answer, `%${q}%`)))
    : eq(historicalQa.userId, userId);
  const rows = await db.query.historicalQa.findMany({
    where: filter,
    orderBy: [desc(historicalQa.createdAt)],
    limit: 200,
  });
  res.json({ items: rows.map(stripEmbedding), total: rows.length });
});

libraryRouter.post('/', async (req, res) => {
  const parsed = z.object({
    question: z.string().min(1).max(2000),
    answer: z.string().min(1).max(2000),
    category: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const row = await addToRag({
    userId: req.user!.userId,
    question: parsed.data.question,
    answer: parsed.data.answer,
    source: 'manual',
    category: parsed.data.category,
  });
  res.status(201).json(stripEmbedding(row));
});

libraryRouter.put('/:id', async (req, res) => {
  const parsed = z.object({
    question: z.string().min(1).max(2000).optional(),
    answer: z.string().min(1).max(2000).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user!.userId;
  const id = req.params.id!;
  const existing = await db.query.historicalQa.findFirst({
    where: and(eq(historicalQa.id, id), eq(historicalQa.userId, userId)),
  });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const next = { ...existing, ...parsed.data };
  const embedding = await llm.embed(`${next.question}\n${next.answer}`);
  const [row] = await db.update(historicalQa)
    .set({ question: next.question, answer: next.answer, embedding })
    .where(eq(historicalQa.id, id))
    .returning();
  res.json(stripEmbedding(row!));
});

libraryRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;
  await db.delete(historicalQa).where(and(eq(historicalQa.id, id), eq(historicalQa.userId, userId)));
  res.status(204).end();
});

libraryRouter.post('/import-prints', upload.array('files'), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) return res.status(400).json({ error: 'No files' });
  const stored = await Promise.all(files.map((f) => storage.save(f.buffer, f.mimetype, f.originalname)));
  const pairs = await llm.extractHistoricalFromImages(stored);
  res.json({ extracted: pairs.length, pairs });
});

libraryRouter.post('/bulk-save', async (req, res) => {
  const parsed = z.object({
    pairs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).max(100),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = req.user!.userId;
  const inserted = [];
  for (const p of parsed.data.pairs) {
    inserted.push(await addToRag({ userId, question: p.question, answer: p.answer, source: 'print' }));
  }
  res.status(201).json({ saved: inserted.length, items: inserted.map(stripEmbedding) });
});

function stripEmbedding<T extends { embedding?: unknown }>(r: T) {
  const { embedding, ...rest } = r;
  return rest;
}
