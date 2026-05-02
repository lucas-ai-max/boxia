import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, caixinhas, brandDna } from '../db/schema.js';
import { storage } from '../lib/storage.js';
import { sessionBus } from '../lib/events.js';
import { llm } from '../services/gemini-provider.js';
import { addToRag } from '../services/rag.js';

export async function processSession(sessionId: string, userId: string, files: { absolutePath: string; mimeType: string }[]) {
  const tag = `session:${sessionId}`;
  try {
    sessionBus.emitFor(sessionId, { type: 'status', sessionId, status: 'processing' });
    sessionBus.emitFor(sessionId, { type: 'step', sessionId, step: 'upload concluído', done: true });
    sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 10 });
    await db.update(sessions).set({ status: 'processing' }).where(eq(sessions.id, sessionId));

    const sessionRow = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
    if (!sessionRow) throw new Error('Session not found');

    sessionBus.emitFor(sessionId, { type: 'step', sessionId, step: 'enviando p/ IA', done: true });
    sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 30 });

    let extraction;
    const promptQ = sessionRow.promptQuestion ?? undefined;
    if (sessionRow.source === 'video') {
      const f = files[0]!;
      extraction = await llm.extractFromVideo(f.absolutePath, f.mimeType, promptQ);
    } else {
      extraction = await llm.extractFromImages(files, promptQ);
    }

    sessionBus.emitFor(sessionId, { type: 'step', sessionId, step: 'extraindo caixinhas', done: true });
    sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 60 });
    sessionBus.emitFor(sessionId, { type: 'caixinhas-extracted', sessionId, total: extraction.totalCaixinhas });

    if (sessionRow.historical) {
      const inserted = await db.insert(caixinhas).values(
        extraction.caixinhas.map((c, idx) => ({
          sessionId,
          pergunta: c.pergunta,
          autorNome: c.autorNome ?? null,
          contextoVisual: c.contextoVisual ?? null,
          timestampSeconds: c.timestampSeconds ?? null,
          printIndex: c.printIndex ?? idx,
          confidence: c.confidence,
          score: 0,
          category: 'pergunta-pessoal' as const,
        })),
      ).returning();
      await db.update(sessions).set({
        status: 'ready',
        totalCaixinhas: extraction.totalCaixinhas,
      }).where(eq(sessions.id, sessionId));
      sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 100 });
      sessionBus.emitFor(sessionId, { type: 'status', sessionId, status: 'ready' });
      return inserted;
    }

    const dnaRow = await db.query.brandDna.findFirst({
      where: eq(brandDna.userId, userId),
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
    const dnaText = dnaRow?.contentText ?? '';

    const classified = await Promise.all(
      extraction.caixinhas.map(async (c) => {
        const cls = await llm.classify({ brandDna: dnaText, pergunta: c.pergunta, contextoVisual: c.contextoVisual });
        return { c, cls };
      }),
    );
    sessionBus.emitFor(sessionId, { type: 'step', sessionId, step: 'classificando relevância', done: true });
    sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 95 });

    const inserted = await db.insert(caixinhas).values(
      classified.map(({ c, cls }, idx) => ({
        sessionId,
        pergunta: c.pergunta,
        autorNome: c.autorNome ?? null,
        contextoVisual: c.contextoVisual ?? null,
        timestampSeconds: c.timestampSeconds ?? null,
        printIndex: c.printIndex ?? (sessionRow.source === 'prints' ? idx : null),
        confidence: c.confidence,
        score: cls.score,
        category: cls.category,
        flags: cls.flags,
      })),
    ).returning();

    await db.update(sessions).set({
      status: 'ready',
      totalCaixinhas: extraction.totalCaixinhas,
    }).where(eq(sessions.id, sessionId));

    sessionBus.emitFor(sessionId, { type: 'progress', sessionId, pct: 100 });
    sessionBus.emitFor(sessionId, { type: 'status', sessionId, status: 'ready' });
    return inserted;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error(`[${tag}] failed:`, message);
    await db.update(sessions).set({ status: 'failed', errorMessage: message }).where(eq(sessions.id, sessionId));
    sessionBus.emitFor(sessionId, { type: 'status', sessionId, status: 'failed' });
  }
}

export async function importHistoricalAnswers(userId: string, pairs: { question: string; answer: string }[]) {
  const inserted = [];
  for (const p of pairs) {
    if (!p.question || !p.answer) continue;
    inserted.push(await addToRag({ userId, question: p.question, answer: p.answer, source: 'print' }));
  }
  return inserted;
}
