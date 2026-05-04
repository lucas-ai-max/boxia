-- ============================================================================
-- BoxIA — migração 4: categorias e flags definidas pelo usuário
-- Cole no SQL Editor do Supabase e clique Run.
-- Idempotente: pode rodar várias vezes sem quebrar.
--
-- Mudanças:
--  - boxia_user_categories: catálogo de categorias do user (chip input).
--  - boxia_user_flags: catálogo de flags do user (chip input, multi-select).
--  - boxia_caixinhas.category: enum → text nullable. Sem default.
--  - boxia_historical_qa.category: enum → text nullable.
--  - boxia_caixinha_category enum: dropado no fim.
-- ============================================================================

-- 1. Catálogo de categorias por usuário.
create table if not exists boxia_user_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references boxia_users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  description text,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists boxia_user_categories_user_idx on boxia_user_categories(user_id);

alter table boxia_user_categories enable row level security;

-- 2. Catálogo de flags por usuário (booleanas multi-select por caixinha).
create table if not exists boxia_user_flags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references boxia_users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  description text,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists boxia_user_flags_user_idx on boxia_user_flags(user_id);

alter table boxia_user_flags enable row level security;

-- 3. boxia_caixinhas.category: enum → text. Tira default e NOT NULL.
do $$
declare
  current_type text;
begin
  select data_type into current_type
    from information_schema.columns
   where table_name = 'boxia_caixinhas' and column_name = 'category';

  if current_type = 'USER-DEFINED' then
    alter table boxia_caixinhas alter column category drop default;
    alter table boxia_caixinhas alter column category drop not null;
    alter table boxia_caixinhas alter column category type text using category::text;
  end if;
end $$;

-- 4. boxia_historical_qa.category: enum → text (já era nullable).
do $$
declare
  current_type text;
begin
  select data_type into current_type
    from information_schema.columns
   where table_name = 'boxia_historical_qa' and column_name = 'category';

  if current_type = 'USER-DEFINED' then
    alter table boxia_historical_qa alter column category type text using category::text;
  end if;
end $$;

-- 5. Recria a função boxia_search_rag (assinatura mudou: category agora é text).
drop function if exists boxia_search_rag(uuid, vector, integer);
create or replace function boxia_search_rag(
  p_user_id uuid,
  p_query_embedding vector(768),
  p_k integer default 5
)
returns table (
  id uuid,
  question text,
  answer text,
  category text,
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

-- 6. Drop do enum antigo (agora sem dependentes).
drop type if exists boxia_caixinha_category;
