# BoxIA

PWA mobile-first para ler caixinhas do Instagram com IA personalizada (Gemini 3 + RAG histórico).

> Implementação baseada no [PRD.md](PRD.md). Wireframes em [Arquivos base/BoxAI/](Arquivos%20base/BoxAI/).

## Estrutura

```
BoxIA/
├── backend/    # API Node.js + Express + TypeScript + Drizzle ORM (Postgres + pgvector)
├── frontend/   # PWA Next.js 15 (App Router) + Tailwind 4
├── PRD.md
└── Arquivos base/   # PRD original, transcrição da aula, wireframes
```

## Setup rápido (dev)

### Pré-requisitos
- Node.js 20+
- **Conta Supabase** ([supabase.com](https://supabase.com)) — banco gerenciado com pgvector
- Conta Google AI Studio com API key (Gemini 3) — opcional; sem ela, o backend roda em **MOCK MODE**

### 0. Configurar Supabase

1. Crie um projeto novo em [app.supabase.com](https://app.supabase.com).
2. Habilite as extensões necessárias: **Database → Extensions** → pesquise e ative `vector` e `pgcrypto`.
3. Pegue a connection string em **Project Settings → Database → Connection string → URI**.
   - Recomendado: use o **Transaction Pooler** ou **Session Pooler** (não a connection direct, que tem limites baixos).
   - Formato: `postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
4. Cole a URL em `backend/.env` como `DATABASE_URL`.

> Alternativa: rodar Postgres local em vez do Supabase — descomente o serviço em [docker-compose.yml](docker-compose.yml) e ajuste a `DATABASE_URL`.

### 1. Backend

**bash / macOS / Linux:**
```bash
cd backend
cp .env.example .env
npm install
npm run db:push
npm run dev            # http://localhost:3333
```

**Windows PowerShell:**
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run db:push
npm run dev
```

Edite `backend/.env` com `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`. Sem `GEMINI_API_KEY` o backend roda em **MOCK MODE**.

### 2. Frontend

**bash / macOS / Linux:**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev            # http://localhost:3000
```

**Windows PowerShell:**
```powershell
cd frontend
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

> ⚠ **PowerShell 5.1 não suporta `&&`** entre comandos. Use comandos em linhas separadas, ou `;` (sem checagem de erro), ou `if ($?) { ... }` (com checagem). PowerShell 7+ aceita `&&` normalmente.

Acesse `http://localhost:3000` no celular (mesma rede) para experimentar como PWA.

## Stack

- **Backend**: Express + TypeScript + Drizzle ORM + Postgres (pgvector) + Gemini 3 SDK + JWT auth
- **Frontend**: Next.js 15 + React 19 + Tailwind 4 + PWA (manifest + service worker)
- **IA**: Gemini 3 (vídeo nativo + visão multimodal) abstraído via interface `LLMProvider`
- **Storage**: filesystem local em dev; pluggable para S3/R2 em prod

## Convenção de cores (do wireframe)

| Token | Hex |
|---|---|
| ACCENT | `#FF6B4A` |
| ACCENT_SOFT | `#FFE4DB` |
| INK | `#1a1a1a` |
| PAPER | `#FAFAF7` |

## Rotas principais (frontend)

| Rota | Tela do wireframe |
|---|---|
| `/` | Welcome (S1) |
| `/onboarding/dna` | DNA da marca (S2) |
| `/home` | Home / histórico (S3) |
| `/sessions/new` | Nova sessão (S4) |
| `/sessions/[id]/processing` | Processando (S5) |
| `/sessions/[id]` | Lista classificada (S6) |
| `/sessions/[id]/caixinhas/[cid]` | Detalhe + sugestões (S7) |
| `/library` | Biblioteca RAG (S8) |
| `/library/import` | Importar histórico (S9) |
| `/metrics` | Métricas (S10) |

## Endpoints principais (backend)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Login (JWT) |
| GET/PUT | `/brand-dna` | DNA da marca |
| POST | `/sessions` | Criar sessão (upload vídeo/prints) |
| GET | `/sessions` | Lista de sessões |
| GET | `/sessions/:id` | Detalhe + caixinhas |
| GET | `/sessions/:id/stream` | SSE com status do processamento |
| POST | `/caixinhas/:id/generate` | Gerar 2-3 sugestões |
| POST | `/feedback` | Registrar 👍 / ✏️ / 🗑 / 📋 |
| GET/POST/PUT/DELETE | `/library` | CRUD de pares Q&A do RAG |
| POST | `/library/import` | Importar batch (prints/vídeo histórico) |
| GET | `/metrics` | Dashboard pessoal |

## Deploy / atualização (produção)

> Frontend: **Vercel** (auto-deploy a cada push em `main`).
> Backend: **VPS** `85.155.186.214`, user `boxia`, PM2 process `boxia-api`, nginx `boxia-api.85.155.186.214.sslip.io` com SSL Let's Encrypt.

### 1. Merge da branch de trabalho em `main` (PowerShell local)

```powershell
cd "c:\Projetos Cursor\BoxIA"
git checkout main
git merge chore/initial-import
git push origin main
```

A Vercel faz o redeploy do frontend sozinha.

### 2. Atualizar o backend na VPS

```bash
ssh root@85.155.186.214
su - boxia                       # SEMPRE trocar pra user boxia
cd ~/boxia
git pull origin main
cd backend
npm run build
pm2 restart boxia-api --update-env
pm2 logs boxia-api --lines 8 --nostream
```

Saída esperada:
```
[db] pgvector + pgcrypto OK
✓ BoxIA backend on http://localhost:3333
  CORS allow: https://boxia.vercel.app
  IA:         pronta
```

### 3. Quando alterar variáveis de ambiente

```bash
nano ~/boxia/backend/.env
pm2 restart boxia-api --update-env   # --update-env é obrigatório, senão PM2 reusa env antigo em memória
```

### 4. PWA no iPhone

1. Abre `https://boxia.vercel.app` no **Safari** (não Chrome iOS)
2. Toca em **Compartilhar** → **Adicionar à Tela de Início**
3. Abre pelo ícone novo na home — roda fullscreen como app
4. Após updates: pode precisar deletar o ícone e adicionar de novo (Service Worker cacheia)

### Troubleshooting rápido

| Sintoma | Causa | Fix |
|---|---|---|
| `cd: /root/boxia: No such file or directory` | Logado como root | `su - boxia` |
| `Process boxia-api not found` em `pm2` | PM2 do root, não do boxia | `su - boxia` antes |
| CORS error no navegador | `.env` desatualizado em memória | `pm2 restart boxia-api --update-env` |
| 502 Bad Gateway no nginx | Backend caiu | `pm2 logs boxia-api --lines 30 --nostream` |
| `npm run db:push` quer apagar tabelas alheias | Banco compartilhado com outro projeto | NUNCA confirmar; abortar com `No, abort` |

## Próximas fases (PRD)

- [ ] UX_SPECS.md (design hi-fi)
- [ ] ARCHITECTURE.md (diagramas, contratos)
- [ ] Sprints/histórias detalhadas
- [ ] Worker assíncrono real (Inngest/BullMQ)
- [ ] Object storage S3/R2 + TTL
- [ ] Autenticação OAuth Google
- [ ] Stripe (V2)
