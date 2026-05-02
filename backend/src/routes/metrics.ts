import { Router } from 'express';
import { sql, eq, and, gte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, caixinhas, feedback, generations, historicalQa } from '../db/schema.js';
import { requireAuth } from '../lib/auth.js';

export const metricsRouter = Router();
metricsRouter.use(requireAuth);

metricsRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const totalCaixinhas = await db.execute(sql`
    select coalesce(sum(total_caixinhas),0)::int as total from boxia_sessions where user_id = ${userId}
  `);
  const ragCount = await db.execute(sql`
    select count(*)::int as total,
           sum(case when source = 'auto_import' then 1 else 0 end)::int as auto_imported,
           sum(case when source = 'manual' then 1 else 0 end)::int as manual
    from boxia_historical_qa where user_id = ${userId}
  `);
  const usageRate = await db.execute(sql`
    select
      count(*) filter (where action in ('copy','edit'))::int as used,
      count(*)::int as total
    from boxia_feedback fb
    join boxia_generations g on g.id = fb.generation_id
    join boxia_caixinhas cx on cx.id = g.caixinha_id
    join boxia_sessions s on s.id = cx.session_id
    where s.user_id = ${userId}
  `);
  const sessionsCount = await db.execute(sql`
    select count(*)::int as total from boxia_sessions where user_id = ${userId}
  `);
  const weekly = await db.execute(sql`
    select
      date_trunc('week', fb.created_at) as week,
      count(*) filter (where action in ('copy','edit'))::int as used,
      count(*)::int as total
    from boxia_feedback fb
    join boxia_generations g on g.id = fb.generation_id
    join boxia_caixinhas cx on cx.id = g.caixinha_id
    join boxia_sessions s on s.id = cx.session_id
    where s.user_id = ${userId} and fb.created_at >= now() - interval '5 weeks'
    group by 1 order by 1
  `);

  const usedRow = usageRate.rows[0] as { used?: number; total?: number } | undefined;
  const used = usedRow?.used ?? 0;
  const totalFb = usedRow?.total ?? 0;
  const ragRow = ragCount.rows[0] as { total?: number; auto_imported?: number; manual?: number } | undefined;

  res.json({
    totalCaixinhas: (totalCaixinhas.rows[0] as { total?: number } | undefined)?.total ?? 0,
    sessionsCount: (sessionsCount.rows[0] as { total?: number } | undefined)?.total ?? 0,
    rag: {
      total: ragRow?.total ?? 0,
      manual: ragRow?.manual ?? 0,
      autoImported: ragRow?.auto_imported ?? 0,
    },
    usageRate: totalFb > 0 ? Math.round((used / totalFb) * 100) : 0,
    weekly: weekly.rows,
  });
});
