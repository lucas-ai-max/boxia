const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const TOKEN_KEY = 'boxia.token';

export const api = {
  url: API_URL,
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = this.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `${res.status} ${res.statusText}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  },
  get<T>(p: string) { return this.request<T>(p); },
  post<T>(p: string, body?: unknown) {
    return this.request<T>(p, {
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(p: string, body?: unknown) {
    return this.request<T>(p, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(p: string, body?: unknown) {
    return this.request<T>(p, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  del<T>(p: string) { return this.request<T>(p, { method: 'DELETE' }); },
};

export type Session = {
  id: string;
  source: 'video' | 'prints';
  totalCaixinhas: number;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  durationSeconds: number | null;
  historical: boolean;
  promptQuestion: string | null;
  createdAt: string;
  costCents: number;
};

export type Caixinha = {
  id: string;
  sessionId: string;
  pergunta: string;
  autorNome: string | null;
  contextoVisual: string | null;
  timestampSeconds: number | null;
  printIndex: number | null;
  confidence: number;
  score: number;
  // slug da categoria do user, ou null se ele ainda não definiu nenhuma.
  category: string | null;
  // chaves são slugs definidos em /flags pelo próprio user.
  flags: Record<string, boolean>;
  approval?: { at: string; taskUrl: string | null } | null;
};

export type UserCategory = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  createdAt: string;
};

export type UserFlag = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  createdAt: string;
};

export type Generation = {
  id: string;
  caixinhaId: string;
  suggestions: string[];
  ragExamplesUsed: string[];
  modelVersion: string;
};

export type LibraryItem = {
  id: string;
  question: string;
  answer: string;
  source: 'print' | 'video' | 'manual' | 'auto_import';
  category: string | null;
  toneTags: string[];
  createdAt: string;
};

export type Metrics = {
  totalCaixinhas: number;
  sessionsCount: number;
  rag: { total: number; manual: number; autoImported: number };
  usageRate: number;
  weekly: { week: string; used: number; total: number }[];
};
