import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, caixinhas } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { storage } from '../lib/storage.js';
import { sessionBus } from '../lib/events.js';
import { processSession } from '../workers/process-session.js';
import { env } from '../config/env.js';

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_VIDEO_MB * 1024 * 1024 },
});

sessionsRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const rows = await db.query.sessions.findMany({
    where: and(eq(sessions.userId, userId)),
    orderBy: [desc(sessions.createdAt)],
    limit: 50,
  });
  res.json({ sessions: rows });
});

sessionsRouter.post('/', upload.array('files'), async (req, res) => {
  const parsed = z.object({
    source: z.enum(['video', 'prints']),
    historical: z.coerce.boolean().optional().default(false),
    promptQuestion: z.string().max(500).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) return res.status(400).json({ error: 'No files uploaded' });
  if (parsed.data.source === 'prints' && files.length > env.MAX_PRINTS_PER_BATCH) {
    return res.status(400).json({ error: `Too many prints (max ${env.MAX_PRINTS_PER_BATCH})` });
  }

  const userId = req.user!.userId;
  const stored = [];
  for (const f of files) {
    stored.push(await storage.save(f.buffer, f.mimetype, f.originalname));
  }

  const [session] = await db.insert(sessions).values({
    userId,
    source: parsed.data.source,
    historical: parsed.data.historical,
    promptQuestion: parsed.data.promptQuestion?.trim() || null,
    storageRef: stored.map((s) => s.ref).join(','),
    status: 'queued',
  }).returning();

  // Disparo assíncrono — em produção: Inngest/BullMQ
  void processSession(session!.id, userId, stored.map((s) => ({ absolutePath: s.absolutePath, mimeType: s.mimeType })));

  res.status(201).json(session);
});

sessionsRouter.get('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, id), eq(sessions.userId, userId)),
  });
  if (!session) return res.status(404).json({ error: 'Not found' });
  const items = await db.query.caixinhas.findMany({
    where: eq(caixinhas.sessionId, id),
    orderBy: [desc(caixinhas.score)],
  });
  res.json({ session, caixinhas: items });
});

sessionsRouter.get('/:id/stream', async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id!;
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, id), eq(sessions.userId, userId)),
  });
  if (!session) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ type: 'status', sessionId: id, status: session.status });
  if (session.status === 'ready' || session.status === 'failed') {
    send({ type: 'caixinhas-extracted', sessionId: id, total: session.totalCaixinhas });
    res.end();
    return;
  }

  const off = sessionBus.onSession(id, (ev) => {
    send(ev);
    if (ev.type === 'status' && (ev.status === 'ready' || ev.status === 'failed')) {
      res.end();
    }
  });
  req.on('close', () => off());
});
