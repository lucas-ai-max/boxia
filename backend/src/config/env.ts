import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(8).default('dev-secret-please-change'),
  JWT_EXPIRES_IN: z.string().default('30d'),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-pro'),
  GEMINI_EMBED_MODEL: z.string().default('text-embedding-004'),

  STORAGE_DRIVER: z.enum(['local', 's3', 'r2']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),
  STORAGE_TTL_DAYS: z.coerce.number().default(7),

  MAX_VIDEO_MB: z.coerce.number().default(500),
  MAX_VIDEO_MINUTES: z.coerce.number().default(15),
  MAX_PRINTS_PER_BATCH: z.coerce.number().default(50),

  CLICKUP_CLIENT_ID: z.string().default(''),
  CLICKUP_CLIENT_SECRET: z.string().default(''),
  CLICKUP_REDIRECT_URI: z.string().default('http://localhost:3333/clickup/oauth/callback'),
  // Default global: se setados, todo user sem integração própria já tem ClickUp
  // "conectado" e os approves caem nesta lista. Use Personal API Token do dono
  // (Settings → Apps → Generate) — não precisa OAuth pra esse fluxo.
  CLICKUP_DEFAULT_TOKEN: z.string().default(''),
  CLICKUP_DEFAULT_LIST_ID: z.string().default(''),
  CLICKUP_DEFAULT_LIST_NAME: z.string().default('Lista padrão'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export const env = schema.parse(process.env);
export type Env = typeof env;
