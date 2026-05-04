import { env } from '../config/env.js';

const API_BASE = 'https://api.clickup.com/api/v2';

export class ClickUpAuthError extends Error {
  constructor(message = 'ClickUp token rejected') {
    super(message);
    this.name = 'ClickUpAuthError';
  }
}

export class ClickUpApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ClickUpApiError';
  }
}

async function callClickUp<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', token);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) throw new ClickUpAuthError();
  if (!res.ok) {
    const text = await res.text();
    throw new ClickUpApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const url = new URL(`${API_BASE}/oauth/token`);
  url.searchParams.set('client_id', env.CLICKUP_CLIENT_ID);
  url.searchParams.set('client_secret', env.CLICKUP_CLIENT_SECRET);
  url.searchParams.set('code', code);
  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) {
    const text = await res.text();
    throw new ClickUpApiError(res.status, text || 'Failed to exchange code');
  }
  return res.json() as Promise<{ access_token: string }>;
}

export type ClickUpTeam = { id: string; name: string; color?: string };
export type ClickUpSpace = { id: string; name: string };
export type ClickUpFolder = { id: string; name: string; lists?: ClickUpList[] };
export type ClickUpList = { id: string; name: string };

export async function listWorkspaces(token: string): Promise<ClickUpTeam[]> {
  const r = await callClickUp<{ teams: ClickUpTeam[] }>(token, '/team');
  return r.teams ?? [];
}

export async function listSpaces(token: string, teamId: string): Promise<ClickUpSpace[]> {
  const r = await callClickUp<{ spaces: ClickUpSpace[] }>(token, `/team/${teamId}/space`);
  return r.spaces ?? [];
}

export async function listFolders(token: string, spaceId: string): Promise<ClickUpFolder[]> {
  const r = await callClickUp<{ folders: ClickUpFolder[] }>(token, `/space/${spaceId}/folder`);
  return r.folders ?? [];
}

export async function listFolderlessLists(token: string, spaceId: string): Promise<ClickUpList[]> {
  const r = await callClickUp<{ lists: ClickUpList[] }>(token, `/space/${spaceId}/list`);
  return r.lists ?? [];
}

export async function listFolderLists(token: string, folderId: string): Promise<ClickUpList[]> {
  const r = await callClickUp<{ lists: ClickUpList[] }>(token, `/folder/${folderId}/list`);
  return r.lists ?? [];
}

export type ClickUpListDetail = {
  id: string;
  name: string;
  space?: { id: string; name?: string };
  folder?: { id: string; name?: string; hidden?: boolean };
};

export async function getList(token: string, listId: string): Promise<ClickUpListDetail> {
  return callClickUp<ClickUpListDetail>(token, `/list/${listId}`);
}

export type FlatList = { id: string; name: string; folderName?: string };

// Achata folder + folderless num único array (folderName presente quando dentro de folder).
export async function listAllLists(token: string, spaceId: string): Promise<FlatList[]> {
  const [folderless, folders] = await Promise.all([
    listFolderlessLists(token, spaceId),
    listFolders(token, spaceId),
  ]);
  const out: FlatList[] = folderless.map((l) => ({ id: l.id, name: l.name }));
  for (const f of folders) {
    const lists = f.lists ?? await listFolderLists(token, f.id);
    for (const l of lists) out.push({ id: l.id, name: l.name, folderName: f.name });
  }
  return out;
}

export type CreateTaskInput = {
  name: string;
  markdown_description?: string;
  tags?: string[];
};

export type CreatedTask = { id: string; url: string };

export async function createTask(token: string, listId: string, input: CreateTaskInput): Promise<CreatedTask> {
  const r = await callClickUp<{ id: string; url: string }>(token, `/list/${listId}/task`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return { id: r.id, url: r.url };
}
