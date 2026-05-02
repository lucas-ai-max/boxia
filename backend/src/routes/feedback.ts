import { Router } from 'express';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { feedback, generations, caixinhas, sessions } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { addToRag } from '../services/rag.js';

export const feedbackRouter = Router();
feedbackRouter.use(requireAuth);

feedbackRouter.post('/', async (req, res) => {
  const parsed = z.object({
    generationId: z.string().uuid(),
    suggestionIndex: z.number().int().min(0).max(2),
    action: z.enum(['like', 'edit', 'discard', 'copy']),
    finalText: z.string().max(2000).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const generation = await db.query.generations.findFirst({
    where: eq(generations.id, parsed.data.generationId),
  });
  if (!generation) return res.status(404).json({ error: 'Generation not found' });

  const cx = await db.query.caixinhas.findFirst({ where: eq(caixinhas.id, generation.caixinhaId) });
  if (!cx) return res.status(404).json({ error: 'Caixinha not found' });
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, cx.sessionId) });
  if (!session || session.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

  const finalText = parsed.data.finalText
    ?? (parsed.data.action === 'copy' ? generation.suggestions[parsed.data.suggestionIndex] : null)
    ?? null;

  const [row] = await db.insert(feedback).values({
    generationId: parsed.data.generationId,
    suggestionIndex: parsed.data.suggestionIndex,
    action: parsed.data.action,
    finalText,
  }).returning();

  // Loop de aprendizado: respostas usadas/editadas viram pares Q&A no RAG histórico (auto-import).
  if ((parsed.data.action === 'copy' || parsed.data.action === 'edit') && finalText) {
    await addToRag({
      userId,
      question: cx.pergunta,
      answer: finalText,
      source: 'auto_import',
      category: cx.category,
    });
  }

  res.status(201).json(row);
});
