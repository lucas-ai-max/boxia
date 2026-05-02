import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb,
  pgEnum, real, index, customType,
} from 'drizzle-orm/pg-core';

const vector = (dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dim})`,
    toDriver: (value) => `[${value.join(',')}]`,
    fromDriver: (value) =>
      typeof value === 'string'
        ? value.replace(/^\[|\]$/g, '').split(',').map(Number)
        : (value as number[]),
  });

// Todos os enums e tabelas usam o prefixo boxia_ para coexistir com Supabase Auth
// e outros projetos no mesmo banco. Manter alinhado com supabase/init.sql.

export const sourceTypeEnum = pgEnum('boxia_source_type', ['video', 'prints']);
export const qaSourceEnum = pgEnum('boxia_qa_source', ['print', 'video', 'manual', 'auto_import']);
export const sessionStatusEnum = pgEnum('boxia_session_status', ['queued', 'processing', 'ready', 'failed']);
export const feedbackActionEnum = pgEnum('boxia_feedback_action', ['like', 'edit', 'discard', 'copy']);
export const caixinhaCategoryEnum = pgEnum('boxia_caixinha_category', [
  'duvida-produto', 'pedido-conteudo', 'elogio', 'feedback-construtivo',
  'oportunidade-lead', 'pergunta-pessoal', 'ruido', 'sensivel',
]);

export const users = pgTable('boxia_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const brandDna = pgTable('boxia_brand_dna', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  contentText: text('content_text').notNull(),
  examples: jsonb('examples').$type<string[]>().default([]).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index('boxia_brand_dna_user_idx').on(t.userId),
}));

export const historicalQa = pgTable('boxia_historical_qa', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  source: qaSourceEnum('source').notNull(),
  category: caixinhaCategoryEnum('category'),
  toneTags: jsonb('tone_tags').$type<string[]>().default([]).notNull(),
  lengthClass: text('length_class'),
  embedding: vector(768)('embedding'),
  approvalScore: real('approval_score').default(1.0),
  autoImported: boolean('auto_imported').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index('boxia_hqa_user_idx').on(t.userId),
  embeddingIdx: index('boxia_hqa_embedding_idx')
    .using('hnsw', sql`${t.embedding} vector_cosine_ops`),
}));

export const sessions = pgTable('boxia_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  source: sourceTypeEnum('source').notNull(),
  storageRef: text('storage_ref'),
  durationSeconds: integer('duration_seconds'),
  totalCaixinhas: integer('total_caixinhas').default(0).notNull(),
  status: sessionStatusEnum('status').default('queued').notNull(),
  costCents: integer('cost_cents').default(0).notNull(),
  historical: boolean('historical').notNull().default(false),
  promptQuestion: text('prompt_question'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  userIdx: index('boxia_sessions_user_idx').on(t.userId),
}));

export const caixinhas = pgTable('boxia_caixinhas', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  pergunta: text('pergunta').notNull(),
  contextoVisual: text('contexto_visual'),
  autorNome: text('autor_nome'),
  timestampSeconds: integer('timestamp_seconds'),
  printIndex: integer('print_index'),
  confidence: real('confidence').default(0.9),
  score: integer('score').default(0).notNull(),
  category: caixinhaCategoryEnum('category').default('duvida-produto').notNull(),
  flags: jsonb('flags').$type<{ urgente?: boolean; sensivel?: boolean; repetida?: boolean }>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  sessionIdx: index('boxia_caixinhas_session_idx').on(t.sessionId),
}));

export const generations = pgTable('boxia_generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  caixinhaId: uuid('caixinha_id').notNull().references(() => caixinhas.id, { onDelete: 'cascade' }),
  suggestions: jsonb('suggestions').$type<string[]>().notNull(),
  ragExamplesUsed: jsonb('rag_examples_used').$type<string[]>().default([]).notNull(),
  modelVersion: text('model_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  caixinhaIdx: index('boxia_gen_caixinha_idx').on(t.caixinhaId),
}));

export const feedback = pgTable('boxia_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  generationId: uuid('generation_id').notNull().references(() => generations.id, { onDelete: 'cascade' }),
  suggestionIndex: integer('suggestion_index').notNull(),
  action: feedbackActionEnum('action').notNull(),
  finalText: text('final_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  genIdx: index('boxia_fb_gen_idx').on(t.generationId),
}));
