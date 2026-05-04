import { sql, and, eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { historicalQa, generations, feedback } from '../db/schema.js';
import { llm } from './gemini-provider.js';

export async function addToRag(input: {
  userId: string;
  question: string;
  answer: string;
  source: 'print' | 'video' | 'manual' | 'auto_import';
  category?: string;
}) {
  const embedding = await llm.embed(`${input.question}\n${input.answer}`);
  const lengthClass = input.answer.length < 80 ? 'curta' : input.answer.length < 200 ? 'media' : 'longa';
  const [row] = await db.insert(historicalQa).values({
    userId: input.userId,
    question: input.question,
    answer: input.answer,
    source: input.source,
    category: input.category ?? null,
    embedding,
    lengthClass,
    autoImported: input.source === 'auto_import',
  }).returning();
  return row!;
}

export async function searchRag(userId: string, query: string, k = 5) {
  const queryEmbedding = await llm.embed(query);
  const vec = `[${queryEmbedding.join(',')}]`;
  const rows = await db.execute(sql`
    select id, question, answer, category, source, approval_score,
           1 - (embedding <=> ${vec}::vector) as similarity
    from boxia_historical_qa
    where user_id = ${userId}
    order by embedding <=> ${vec}::vector
    limit ${k}
  `);
  return rows.rows as Array<{
    id: string; question: string; answer: string;
    category: string | null; source: string; approval_score: number;
    similarity: number;
  }>;
}

export async function recentApprovedTexts(userId: string, n = 5): Promise<string[]> {
  const rows = await db
    .select({ text: feedback.finalText, action: feedback.action, createdAt: feedback.createdAt })
    .from(feedback)
    .innerJoin(generations, eq(feedback.generationId, generations.id))
    .innerJoin(historicalQa, eq(historicalQa.userId, historicalQa.userId))
    .where(and(eq(historicalQa.userId, userId)))
    .orderBy(desc(feedback.createdAt))
    .limit(n);
  return rows.map((r) => r.text).filter((t): t is string => !!t).slice(0, n);
}
