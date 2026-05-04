-- ============================================================================
-- BoxIA — migração 3: integração ClickUp + ação 'approve' no feedback
-- Cole no SQL Editor do Supabase e clique Run.
-- Idempotente: pode rodar várias vezes sem quebrar.
-- ============================================================================

-- 1. Adiciona valor 'approve' ao enum de feedback (substituiu 'copy' como ação primária na UI).
do $$ begin
  alter type boxia_feedback_action add value if not exists 'approve';
exception when duplicate_object then null; end $$;

-- 2. Tabela de integração com ClickUp (1 row por user).
create table if not exists boxia_clickup_integrations (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references boxia_users(id) on delete cascade,
  access_token             text not null,
  default_workspace_id     text,
  default_workspace_name   text,
  default_space_id         text,
  default_list_id          text,
  default_list_name        text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table boxia_clickup_integrations enable row level security;
-- Sem políticas — só o backend (service_role) acessa.

-- 3. URL da task criada no ClickUp (se action='approve'), pra UI mostrar
--    badge "Aprovada ✓ — Ver no ClickUp" persistente em re-aberturas.
alter table boxia_feedback
  add column if not exists clickup_task_url text;
