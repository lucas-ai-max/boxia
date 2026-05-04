// Slug ASCII pra usar em prompts da IA e em chaves de jsonb (flags).
// Mantém apenas a-z, 0-9 e hífen. Nunca vazio (fallback "item").
export function slugify(input: string): string {
  const normalized = input
    .normalize('NFD')
    // Remove diacríticos (combining marks U+0300..U+036F).
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || 'item';
}

// Garante slug único dentro de um conjunto (ex.: as outras categorias do user).
// Se "duvida" colide, tenta "duvida-2", "duvida-3", etc.
export function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
