import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? '';
const isSupabase = /supabase\.(co|com)/.test(url);

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  },
  verbose: true,
  strict: true,
});
