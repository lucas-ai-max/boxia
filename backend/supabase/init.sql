-- ============================================================================
-- BoxIA — schema inicial para Supabase
-- Cole este arquivo inteiro em: Supabase Dashboard → SQL Editor → New query → Run
--
-- Convenção: TODAS as tabelas, enums, índices e funções deste app usam o
-- prefixo `boxia_` para não conflitar com tabelas do Supabase Auth ou outros
-- projetos hospedados no mesmo banco.
-- ============================================================================

-- ── 1. Extensões ────────────────────────────────────────────────────────────
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ── 2. Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type boxia_source_type as enum ('video', 'prints');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boxia_qa_source as enum ('print', 'video', 'manual', 'auto_import');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boxia_session_status as enum ('queued', 'processing', 'ready', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boxia_feedback_action as enum ('like', 'edit', 'discard', 'copy');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boxia_caixinha_category as enum (
    'duvida-produto', 'pedido-conteudo', 'elogio', 'feedback-construtivo',
    'oportunidade-lead', 'pergunta-pessoal', 'ruido', 'sensivel'
  );
exception when duplicate_object then null; end $$;

-- ── 3. Tabelas ──────────────────────────────────────────────────────────────

-- 3.1 Usuários (auth próprio — JWT)
create table if not exists boxia_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  display_name  text,
  created_at    timestamptz not null default now()
);

-- 3.2 DNA da marca (versionado)
create table if not exists boxia_brand_dna (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references boxia_users(id) on delete cascade,
  version      integer not null default 1,
  content_text text not null,
  examples     jsonb not null default '[]'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists boxia_brand_dna_user_idx on boxia_brand_dna(user_id);

-- 3.3 RAG histórico de pares Q&A (núcleo da autenticidade)
create table if not exists boxia_historical_qa (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references boxia_users(id) on delete cascade,
  question        text not null,
  answer          text not null,
  source          boxia_qa_source not null,
  category        boxia_caixinha_category,
  tone_tags       jsonb not null default '[]'::jsonb,
  length_class    text,
  embedding       vector(768),
  approval_score  real default 1.0,
  auto_imported   boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists boxia_hqa_user_idx on boxia_historical_qa(user_id);
create index if not exists boxia_hqa_embedding_idx
  on boxia_historical_qa using hnsw (embedding vector_cosine_ops);

-- 3.4 Sessões de processamento
create table if not exists boxia_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references boxia_users(id) on delete cascade,
  source            boxia_source_type not null,
  storage_ref       text,
  duration_seconds  integer,
  total_caixinhas   integer not null default 0,
  status            boxia_session_status not null default 'queued',
  cost_cents        integer not null default 0,
  historical        boolean not null default false,
  prompt_question   text,
  error_message     text,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index if not exists boxia_sessions_user_idx on boxia_sessions(user_id);

-- 3.5 Caixinhas extraídas
create table if not exists boxia_caixinhas (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references boxia_sessions(id) on delete cascade,
  pergunta           text not null,
  contexto_visual    text,
  autor_nome         text,
  timestamp_seconds  integer,
  print_index        integer,
  confidence         real default 0.9,
  score              integer not null default 0,
  category           boxia_caixinha_category not null default 'duvida-produto',
  flags              jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index if not exists boxia_caixinhas_session_idx on boxia_caixinhas(session_id);

-- 3.6 Gerações de resposta
create table if not exists boxia_generations (
  id                  uuid primary key default gen_random_uuid(),
  caixinha_id         uuid not null references boxia_caixinhas(id) on delete cascade,
  suggestions         jsonb not null,
  rag_examples_used   jsonb not null default '[]'::jsonb,
  model_version       text not null,
  created_at          timestamptz not null default now()
);
create index if not exists boxia_gen_caixinha_idx on boxia_generations(caixinha_id);

-- 3.7 Feedback do usuário (loop de aprendizado)
create table if not exists boxia_feedback (
  id                uuid primary key default gen_random_uuid(),
  generation_id     uuid not null references boxia_generations(id) on delete cascade,
  suggestion_index  integer not null,
  action            boxia_feedback_action not null,
  final_text        text,
  created_at        timestamptz not null default now()
);
create index if not exists boxia_fb_gen_idx on boxia_feedback(generation_id);

-- ── 4. RLS (Row-Level Security) — defesa em profundidade ────────────────────
-- Como o app usa JWT próprio (não Supabase Auth), o backend acessa o banco
-- via service_role e bypassa RLS. Mesmo assim, deixamos RLS habilitada e sem
-- política aberta para BLOQUEAR acesso direto via anon/authenticated keys do
-- Supabase, garantindo que ninguém consiga ler dados de outros tenants pela
-- API REST automática do Supabase.

alter table boxia_users          enable row level security;
alter table boxia_brand_dna      enable row level security;
alter table boxia_historical_qa  enable row level security;
alter table boxia_sessions       enable row level security;
alter table boxia_caixinhas      enable row level security;
alter table boxia_generations    enable row level security;
alter table boxia_feedback       enable row level security;

-- Sem políticas = ninguém via PostgREST consegue ler/escrever.
-- O backend usa service_role (bypass RLS) — única forma de acessar.
-- Se um dia migrar para Supabase Auth, adicione políticas tipo:
--   create policy "owner read"
--     on boxia_sessions for select using (auth.uid() = user_id);

-- ── 5. Função utilitária: busca semântica top-k no RAG por usuário ──────────
create or replace function boxia_search_rag(
  p_user_id uuid,
  p_query_embedding vector(768),
  p_k integer default 5
)
returns table (
  id uuid,
  question text,
  answer text,
  category boxia_caixinha_category,
  source boxia_qa_source,
  approval_score real,
  similarity real
)
language sql stable as $$
  select
    h.id, h.question, h.answer, h.category, h.source, h.approval_score,
    1 - (h.embedding <=> p_query_embedding)::real as similarity
  from boxia_historical_qa h
  where h.user_id = p_user_id
    and h.embedding is not null
  order by h.embedding <=> p_query_embedding
  limit p_k
$$;

-- ── 6. Job opcional de TTL: marca para soft-delete sessões > 7 dias ─────────
-- Em produção, agende com pg_cron (Database → Cron Jobs no Supabase Dashboard).
create or replace function boxia_purge_old_sessions(days integer default 7)
returns integer language plpgsql as $$
declare
  affected integer;
begin
  update boxia_sessions
    set deleted_at = now(), storage_ref = null
    where deleted_at is null
      and created_at < now() - make_interval(days => days);
  get diagnostics affected = row_count;
  return affected;
end $$;

-- ── 7. Verificação ──────────────────────────────────────────────────────────
-- Após rodar, confirme com:
--   select table_name from information_schema.tables
--    where table_schema = 'public' and table_name like 'boxia_%';
-- Devem aparecer 7 tabelas: boxia_users, boxia_brand_dna, boxia_historical_qa,
-- boxia_sessions, boxia_caixinhas, boxia_generations, boxia_feedback.
