import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { feedback, generations, caixinhas, sessions, clickupIntegrations } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { addToRag } from '../services/rag.js';
import { createTask, ClickUpAuthError, ClickUpApiError } from '../services/clickup.js';
import { env } from '../config/env.js';

export const feedbackRouter = Router();
feedbackRouter.use(requireAuth);

feedbackRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = z.object({
    generationId: z.string().uuid(),
    suggestionIndex: z.number().int().min(0).max(2),
    action: z.enum(['like', 'edit', 'discard', 'copy', 'approve']),
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
    ?? ((parsed.data.action === 'copy' || parsed.data.action === 'approve')
      ? generation.suggestions[parsed.data.suggestionIndex]
      : null)
    ?? null;

  let clickupTaskUrl: string | undefined;
  if (parsed.data.action === 'approve') {
    if (!finalText) return res.status(400).json({ error: 'missing_final_text' });

    // Ordem de preferência: integração própria do user > default global do app.
    let token: string | null = null;
    let listId: string | null = null;
    let scope: 'user' | 'global' = 'user';

    try {
      const integration = await db.query.clickupIntegrations.findFirst({
        where: eq(clickupIntegrations.userId, userId),
      });
      if (integration?.defaultListId) {
        token = integration.accessToken;
        listId = integration.defaultListId;
      }
    } catch {
      // tabela pode não existir ainda; cai pro global
    }

    if (!token || !listId) {
      if (env.CLICKUP_DEFAULT_TOKEN && env.CLICKUP_DEFAULT_LIST_ID) {
        token = env.CLICKUP_DEFAULT_TOKEN;
        listId = env.CLICKUP_DEFAULT_LIST_ID;
        scope = 'global';
      }
    }

    if (!token || !listId) {
      return res.status(400).json({ error: 'clickup_not_configured' });
    }

    const description = [
      '**Resposta aprovada**',
      '',
      finalText,
      '',
      '---',
      `- **Pergunta:** ${cx.pergunta}`,
      `- **De:** ${cx.autorNome ?? 'anônimo'}`,
      `- **Categoria:** ${cx.category}`,
      `- [Abrir no BoxIA](${env.FRONTEND_URL}/sessions/${session.id}/caixinhas/${cx.id})`,
    ].join('\n');

    const taskTitle = cx.autorNome ? `${cx.autorNome}: ${cx.pergunta}` : cx.pergunta;

    try {
      const task = await createTask(token, listId, {
        name: taskTitle,
        markdown_description: description,
        tags: cx.category ? [cx.category] : [],
      });
      clickupTaskUrl = task.url;
    } catch (err) {
      if (err instanceof ClickUpAuthError) {
        if (scope === 'user') {
          await db.delete(clickupIntegrations).where(eq(clickupIntegrations.userId, userId));
        } else {
          console.error('[feedback] CLICKUP_DEFAULT_TOKEN inválido — admin precisa renovar');
        }
        return res.status(400).json({ error: 'clickup_disconnected' });
      }
      if (err instanceof ClickUpApiError) {
        console.error('[feedback] clickup createTask failed', err.status, err.message);
        return res.status(502).json({ error: 'clickup_api_error', detail: err.message });
      }
      throw err;
    }
  }

  const [row] = await db.insert(feedback).values({
    generationId: parsed.data.generationId,
    suggestionIndex: parsed.data.suggestionIndex,
    action: parsed.data.action,
    finalText,
    clickupTaskUrl: clickupTaskUrl ?? null,
  }).returning();

  // Loop de aprendizado: respostas usadas/editadas/aprovadas viram pares Q&A no RAG histórico (auto-import).
  if ((parsed.data.action === 'copy' || parsed.data.action === 'edit' || parsed.data.action === 'approve') && finalText) {
    await addToRag({
      userId,
      question: cx.pergunta,
      answer: finalText,
      source: 'auto_import',
      category: cx.category ?? undefined,
    });
  }

  res.status(201).json({ ...row, clickupTaskUrl });
}));
