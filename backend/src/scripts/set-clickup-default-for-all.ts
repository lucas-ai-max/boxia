// Script admin one-shot: define uma lista do ClickUp como default pra TODOS
// os users que já conectaram a integração. Pula users cuja conta não tem
// acesso à lista (token de outro workspace) ou cujo token foi revogado.
//
// Uso:
//   npm run seed:clickup-list -- <URL ou listId>
// Ex.:
//   npm run seed:clickup-list -- https://app.clickup.com/9011731314/v/l/li/901113714565
//   npm run seed:clickup-list -- 901113714565

import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clickupIntegrations } from '../db/schema.js';
import { getList, ClickUpAuthError, ClickUpApiError } from '../services/clickup.js';

function parseListId(input: string): { listId: string; teamId?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // URL padrão: https://app.clickup.com/<teamId>/v/l/li/<listId>
  const urlMatch = trimmed.match(/clickup\.com\/(\d+)\/.*\/li\/(\d+)/);
  if (urlMatch) return { teamId: urlMatch[1]!, listId: urlMatch[2]! };
  // Só listId numérico
  if (/^\d+$/.test(trimmed)) return { listId: trimmed };
  // Só /li/<id> sem teamId
  const idOnly = trimmed.match(/li\/(\d+)/);
  if (idOnly) return { listId: idOnly[1]! };
  return null;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('uso: npm run seed:clickup-list -- <URL ou listId>');
    process.exit(1);
  }
  const parsed = parseListId(arg);
  if (!parsed) {
    console.error(`não consegui extrair listId de: ${arg}`);
    process.exit(1);
  }
  const { listId, teamId } = parsed;
  console.log(`alvo: listId=${listId}${teamId ? ` (team=${teamId})` : ''}`);

  const integrations = await db.query.clickupIntegrations.findMany();
  if (integrations.length === 0) {
    console.log('nenhum user com ClickUp conectado.');
    process.exit(0);
  }
  console.log(`encontrei ${integrations.length} integrações. validando acesso à lista pra cada uma...`);

  let ok = 0, skipped = 0, failed = 0;
  for (const row of integrations) {
    try {
      const detail = await getList(row.accessToken, listId);
      const listName = detail.folder?.name
        ? `${detail.folder.name} / ${detail.name}`
        : detail.name;
      await db.update(clickupIntegrations)
        .set({
          defaultWorkspaceId: teamId ?? row.defaultWorkspaceId,
          defaultSpaceId: detail.space?.id ?? row.defaultSpaceId,
          defaultListId: listId,
          defaultListName: listName,
          updatedAt: new Date(),
        })
        .where(eq(clickupIntegrations.userId, row.userId));
      console.log(`  ✓ user=${row.userId} → "${listName}"`);
      ok++;
    } catch (err) {
      if (err instanceof ClickUpAuthError) {
        console.log(`  ⚠ user=${row.userId} → token revogado, pulando`);
        skipped++;
      } else if (err instanceof ClickUpApiError && (err.status === 404 || err.status === 403)) {
        console.log(`  ⚠ user=${row.userId} → sem acesso à lista (${err.status}), pulando`);
        skipped++;
      } else {
        console.error(`  ✗ user=${row.userId} →`, (err as Error).message);
        failed++;
      }
    }
  }

  console.log(`\nresumo: ${ok} ok · ${skipped} sem acesso · ${failed} erros`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
