import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

// Supabase exige SSL. Aceitamos certificado self-signed do pooler.
const isSupabase = /supabase\.(co|com)/.test(env.DATABASE_URL);
const ssl = isSupabase || env.NODE_ENV === 'production'
  ? { rejectUnauthorized: false }
  : false;

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
});

export const db = drizzle(pool, { schema });
export { schema };

export async function ensureExtensions() {
  // No Supabase: extensões são habilitadas no Dashboard → Database → Extensions.
  // Tentamos criar mesmo assim; se a role não tiver permissão, ignoramos.
  try { await pool.query('CREATE EXTENSION IF NOT EXISTS vector'); } catch {}
  try { await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto'); } catch {}
}
