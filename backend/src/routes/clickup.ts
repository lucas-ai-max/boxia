import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clickupIntegrations } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { env } from '../config/env.js';
import {
  exchangeCode,
  listWorkspaces,
  listSpaces,
  listAllLists,
  ClickUpAuthError,
} from '../services/clickup.js';

export const clickupRouter = Router();

const STATE_KIND = 'clickup_oauth';
type StatePayload = { kind: typeof STATE_KIND; userId: string };

function signState(userId: string): string {
  return jwt.sign({ kind: STATE_KIND, userId } satisfies StatePayload, env.JWT_SECRET, { expiresIn: '5m' });
}
function verifyState(token: string): StatePayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as StatePayload;
    if (decoded.kind !== STATE_KIND) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Erro do Postgres "relation does not exist" — tabela ainda não foi migrada.
function isMissingTableError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '42P01';
}

// Callback é público (vem do navegador depois do redirect do ClickUp, sem JWT do BoxIA).
clickupRouter.get('/oauth/callback', asyncHandler(async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';
  const back = (reason: string) => res.redirect(`${env.FRONTEND_URL}/settings?clickup=error&reason=${encodeURIComponent(reason)}`);

  if (!code || !stateRaw) return back('missing_params');
  const state = verifyState(stateRaw);
  if (!state) return back('invalid_state');
  if (!env.CLICKUP_CLIENT_ID || !env.CLICKUP_CLIENT_SECRET) return back('not_configured');

  try {
    const { access_token } = await exchangeCode(code);
    await db.insert(clickupIntegrations)
      .values({ userId: state.userId, accessToken: access_token, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: clickupIntegrations.userId,
        set: { accessToken: access_token, updatedAt: new Date() },
      });
    return res.redirect(`${env.FRONTEND_URL}/settings?clickup=connected`);
  } catch (err) {
    console.error('[clickup] oauth callback failed', err);
    return back('exchange_failed');
  }
}));

// As demais rotas exigem auth do BoxIA.
clickupRouter.use(requireAuth);

clickupRouter.get('/oauth/start', (req, res) => {
  if (!env.CLICKUP_CLIENT_ID) return res.status(503).json({ error: 'clickup_not_configured' });
  const state = signState(req.user!.userId);
  const url = new URL('https://app.clickup.com/api');
  url.searchParams.set('client_id', env.CLICKUP_CLIENT_ID);
  url.searchParams.set('redirect_uri', env.CLICKUP_REDIRECT_URI);
  url.searchParams.set('state', state);
  res.json({ url: url.toString() });
});

function globalDefault(): { id: string; name: string } | null {
  if (!env.CLICKUP_DEFAULT_TOKEN || !env.CLICKUP_DEFAULT_LIST_ID) return null;
  return { id: env.CLICKUP_DEFAULT_LIST_ID, name: env.CLICKUP_DEFAULT_LIST_NAME };
}

clickupRouter.get('/status', asyncHandler(async (req, res) => {
  const fallback = globalDefault();
  try {
    const row = await db.query.clickupIntegrations.findFirst({
      where: eq(clickupIntegrations.userId, req.user!.userId),
    });
    if (row?.defaultListId) {
      return res.json({
        connected: true,
        scope: 'user',
        defaultList: { id: row.defaultListId, name: row.defaultListName, workspaceName: row.defaultWorkspaceName },
      });
    }
    if (row && !row.defaultListId) {
      // Conectou OAuth mas ainda não escolheu lista — se há global, mostramos ela como ativa.
      if (fallback) return res.json({ connected: true, scope: 'global', defaultList: fallback });
      return res.json({ connected: true, scope: 'user', defaultList: null });
    }
    if (fallback) return res.json({ connected: true, scope: 'global', defaultList: fallback });
    return res.json({ connected: false });
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn('[clickup] tabela boxia_clickup_integrations ausente — rode migration-3.sql');
      if (fallback) return res.json({ connected: true, scope: 'global', defaultList: fallback });
      return res.json({ connected: false });
    }
    throw err;
  }
}));

async function getToken(userId: string): Promise<string | null> {
  const row = await db.query.clickupIntegrations.findFirst({
    where: eq(clickupIntegrations.userId, userId),
  });
  return row?.accessToken ?? null;
}

async function withToken<T>(userId: string, res: import('express').Response, fn: (token: string) => Promise<T>): Promise<T | undefined> {
  const token = await getToken(userId);
  if (!token) {
    res.status(400).json({ error: 'clickup_not_configured' });
    return;
  }
  try {
    return await fn(token);
  } catch (err) {
    if (err instanceof ClickUpAuthError) {
      await db.delete(clickupIntegrations).where(eq(clickupIntegrations.userId, userId));
      res.status(400).json({ error: 'clickup_disconnected' });
      return;
    }
    throw err;
  }
}

clickupRouter.get('/workspaces', asyncHandler(async (req, res) => {
  const teams = await withToken(req.user!.userId, res, (t) => listWorkspaces(t));
  if (teams) res.json({ teams });
}));

clickupRouter.get('/spaces', asyncHandler(async (req, res) => {
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : '';
  if (!teamId) return res.status(400).json({ error: 'missing teamId' });
  const spaces = await withToken(req.user!.userId, res, (t) => listSpaces(t, teamId));
  if (spaces) res.json({ spaces });
}));

clickupRouter.get('/lists', asyncHandler(async (req, res) => {
  const spaceId = typeof req.query.spaceId === 'string' ? req.query.spaceId : '';
  if (!spaceId) return res.status(400).json({ error: 'missing spaceId' });
  const lists = await withToken(req.user!.userId, res, (t) => listAllLists(t, spaceId));
  if (lists) res.json({ lists });
}));

clickupRouter.put('/default-list', asyncHandler(async (req, res) => {
  const parsed = z.object({
    workspaceId: z.string().min(1),
    workspaceName: z.string().min(1),
    spaceId: z.string().min(1),
    listId: z.string().min(1),
    listName: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.user!.userId;
  const existing = await db.query.clickupIntegrations.findFirst({
    where: eq(clickupIntegrations.userId, userId),
  });
  if (!existing) return res.status(400).json({ error: 'clickup_not_configured' });

  await db.update(clickupIntegrations)
    .set({
      defaultWorkspaceId: parsed.data.workspaceId,
      defaultWorkspaceName: parsed.data.workspaceName,
      defaultSpaceId: parsed.data.spaceId,
      defaultListId: parsed.data.listId,
      defaultListName: parsed.data.listName,
      updatedAt: new Date(),
    })
    .where(eq(clickupIntegrations.userId, userId));
  res.json({ ok: true });
}));

clickupRouter.delete('/integration', asyncHandler(async (req, res) => {
  await db.delete(clickupIntegrations).where(eq(clickupIntegrations.userId, req.user!.userId));
  res.json({ ok: true });
}));
