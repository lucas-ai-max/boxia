# BoxIA — Backend

API Node.js + Express + TypeScript com **Supabase** (Postgres + pgvector) e Gemini 3.

## Setup

```bash
cp .env.example .env
# edite DATABASE_URL (Supabase pooler URL), GEMINI_API_KEY, JWT_SECRET
npm install
npm run db:push
npm run dev
```

### Configuração do Supabase

1. Crie um projeto em [app.supabase.com](https://app.supabase.com).
2. **SQL Editor → New query** → cole o conteúdo de [supabase/init.sql](supabase/init.sql) e clique **Run**. Isso cria as 7 tabelas (todas com prefixo `boxia_`), enums, índices HNSW para busca vetorial, RLS habilitado e a função `boxia_search_rag()`.
3. **Project Settings → Database → Connection string → URI** → copie a URL do **Transaction Pooler** ou **Session Pooler** e cole em `DATABASE_URL`.

> Como o SQL já cria tudo, você **não precisa rodar `npm run db:push`** — o schema do Drizzle ([src/db/schema.ts](src/db/schema.ts)) está sincronizado com o init.sql usando os mesmos nomes prefixados.

A conexão usa SSL automaticamente quando a URL contém `supabase.co/com` (ver [src/db/index.ts](src/db/index.ts)).

## Rotas

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | — | Status + se Gemini está configurado |
| POST | `/auth/register` | — | Cria conta (email + senha) |
| POST | `/auth/login` | — | Login (retorna JWT) |
| GET | `/auth/me` | ✓ | Perfil atual |
| GET | `/brand-dna` | ✓ | DNA ativo + versões |
| PUT | `/brand-dna` | ✓ | Cria nova versão de DNA |
| GET | `/sessions` | ✓ | Histórico de sessões |
| POST | `/sessions` | ✓ | Cria sessão (multipart: source, files[], historical?) |
| GET | `/sessions/:id` | ✓ | Sessão + caixinhas extraídas |
| GET | `/sessions/:id/stream` | ✓ | SSE com status do processamento |
| POST | `/caixinhas/:id/generate` | ✓ | Gera 2-3 sugestões com RAG (body: { modifier?, maxChars? }) |
| PUT | `/caixinhas/historical/:id/answer` | ✓ | Salva resposta de caixinha histórica no RAG |
| POST | `/feedback` | ✓ | Registra 👍 / ✏️ / 🗑 / 📋 (auto-importa pra RAG em copy/edit) |
| GET | `/library` | ✓ | Lista pares Q&A do RAG (busca via `?q=`) |
| POST | `/library` | ✓ | Adiciona par manual |
| PUT | `/library/:id` | ✓ | Edita par |
| DELETE | `/library/:id` | ✓ | Remove par |
| POST | `/library/import-prints` | ✓ | Sobe N prints, IA extrai pares Q&A para revisão |
| POST | `/library/bulk-save` | ✓ | Salva pares em batch após revisão |
| GET | `/metrics` | ✓ | Dashboard pessoal |

## Modo MOCK

Se `GEMINI_API_KEY` não estiver setado, o provider retorna dados simulados — você consegue rodar a UI inteira sem custo de IA. O `/health` mostra `hasGemini: false` nesse caso.

## Schema (Drizzle)

Veja [src/db/schema.ts](src/db/schema.ts). Tabelas: `users`, `brand_dna`, `historical_qa` (com `embedding vector(768)` + índice HNSW), `sessions`, `caixinhas`, `generations`, `feedback`.

> ⚠ Este backend usa **auth próprio (JWT)** e tabela `users` própria — não o `auth.users` do Supabase. Se quiser usar Supabase Auth, é uma refatoração futura (substituir [src/lib/auth.ts](src/lib/auth.ts) e [src/routes/auth.ts](src/routes/auth.ts) por validação de JWT do Supabase via `@supabase/supabase-js`).

## Pipeline de processamento

`POST /sessions` → grava no DB com status `queued` → dispara `processSession()` (worker inline; trocar por Inngest/BullMQ em produção) → emite eventos via `sessionBus` → frontend consome via SSE.

## Trocar Gemini por outro provedor

Implementar `LLMProvider` ([src/services/llm-provider.ts](src/services/llm-provider.ts)) e exportar via `services/gemini-provider.ts`.
