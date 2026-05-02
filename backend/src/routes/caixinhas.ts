import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { caixinhas, sessions, brandDna, generations, historicalQa } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { llm } from '../services/gemini-provider.js';
import { recentApprovedTexts, searchRag } from '../services/rag.js';

export const caixinhasRouter = Router();
caixinhasRouter.use(requireAuth);

caixinhasRouter.get('/:id/generation', async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;

  const cx = await db.query.caixinhas.findFirst({ where: eq(caixinhas.id, id) });
  if (!cx) return res.status(404).json({ error: 'Caixinha not found' });

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, cx.sessionId) });
  if (!session || session.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

  const generation = await db.query.generations.findFirst({
    where: eq(generations.caixinhaId, id),
    orderBy: [desc(generations.createdAt)],
  });
  if (!generation) return res.status(204).end();

  const ragIds = generation.ragExamplesUsed ?? [];
  const inspiredBy = ragIds.length
    ? await db
        .select({ id: historicalQa.id, question: historicalQa.question, answer: historicalQa.answer })
        .from(historicalQa)
        .where(and(eq(historicalQa.userId, userId), inArray(historicalQa.id, ragIds)))
    : [];

  res.json({ generation, inspiredBy });
});

caixinhasRouter.post('/:id/generate', async (req, res) => {
  const parsed = z.object({
    modifier: z.string().max(200).optional(),
    maxChars: z.number().int().min(40).max(2000).optional(),
  }).safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const id = req.params.id!;

  const cx = await db.query.caixinhas.findFirst({ where: eq(caixinhas.id, id) });
  if (!cx) return res.status(404).json({ error: 'Caixinha not found' });

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, cx.sessionId) });
  if (!session || session.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

  const dna = await db.query.brandDna.findFirst({
    where: eq(brandDna.userId, userId),
    orderBy: [desc(brandDna.version)],
  });

  const ragHits = await searchRag(userId, cx.pergunta, 5);
  const recent = await recentApprovedTexts(userId, 3);

  const suggestions = await llm.generate({
    brandDna: dna?.contentText ?? '',
    brandExamples: dna?.examples ?? [],
    ragExamples: ragHits.map((r) => ({ question: r.question, answer: r.answer })),
    recentApproved: recent,
    pergunta: cx.pergunta,
    category: cx.category,
    modifier: parsed.data.modifier,
    maxChars: parsed.data.maxChars ?? 280,
    promptQuestion: session.promptQuestion ?? undefined,
    autorNome: cx.autorNome ?? undefined,
  });

  const [generation] = await db.insert(generations).values({
    caixinhaId: cx.id,
    suggestions,
    ragExamplesUsed: ragHits.map((r) => r.id),
    modelVersion: llm.modelVersion(),
  }).returning();

  res.json({
    generation,
    inspiredBy: ragHits.map((r) => ({ id: r.id, question: r.question, answer: r.answer })),
  });
});

caixinhasRouter.put('/historical/:id/answer', async (req, res) => {
  const parsed = z.object({ answer: z.string().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const id = req.params.id!;
  const cx = await db.query.caixinhas.findFirst({ where: eq(caixinhas.id, id) });
  if (!cx) return res.status(404).json({ error: 'Not found' });
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, cx.sessionId) });
  if (!session || session.userId !== userId || !session.historical) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { addToRag } = await import('../services/rag.js');
  const row = await addToRag({
    userId,
    question: cx.pergunta,
    answer: parsed.data.answer,
    source: cx.printIndex !== null ? 'print' : 'video',
  });
  res.json(row);
});
