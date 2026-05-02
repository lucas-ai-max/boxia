-- ============================================================================
-- BoxIA — migração 2: nome do autor + pergunta original do criador
-- Cole no SQL Editor do Supabase e clique Run.
-- Idempotente: pode rodar várias vezes sem quebrar.
-- ============================================================================

-- Pergunta que o CRIADOR fez na caixinha (contexto pra IA gerar resposta correta).
-- Ex.: criador postou "qual seu super-herói favorito?" → seguidores respondem.
alter table boxia_sessions
  add column if not exists prompt_question text;

-- Nome do seguidor que respondeu/perguntou (não anonimizamos mais).
alter table boxia_caixinhas
  add column if not exists autor_nome text;
