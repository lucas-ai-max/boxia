import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ensureExtensions } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { brandDnaRouter } from './routes/brand-dna.js';
import { sessionsRouter } from './routes/sessions.js';
import { caixinhasRouter } from './routes/caixinhas.js';
import { feedbackRouter } from './routes/feedback.js';
import { libraryRouter } from './routes/library.js';
import { metricsRouter } from './routes/metrics.js';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  // Não expomos o nome do modelo upstream — a UI mostra só "BoxIA".
  res.json({ ok: true, iaReady: !!env.GEMINI_API_KEY });
});

app.use('/auth', authRouter);
app.use('/brand-dna', brandDnaRouter);
app.use('/sessions', sessionsRouter);
app.use('/caixinhas', caixinhasRouter);
app.use('/feedback', feedbackRouter);
app.use('/library', libraryRouter);
app.use('/metrics', metricsRouter);

app.use((err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err);
  res.status(err.statusCode ?? 500).json({ error: err.message ?? 'Internal error' });
});

async function bootstrap() {
  try {
    await ensureExtensions();
    console.log('[db] pgvector + pgcrypto OK');
  } catch (err) {
    console.warn('[db] could not ensure extensions (run as superuser):', (err as Error).message);
  }
  app.listen(env.PORT, () => {
    console.log(`✓ BoxIA backend on http://localhost:${env.PORT}`);
    console.log(`  CORS allow: ${env.CORS_ORIGIN}`);
    if (env.GEMINI_API_KEY) {
      console.log(`  IA:         pronta`);
    } else {
      console.log(`  IA:         ⚠ desconfigurada — defina GEMINI_API_KEY no .env`);
      console.log(`              (sem a chave, qualquer ação da IA vai retornar erro 503)`);
    }
  });
}

bootstrap();
