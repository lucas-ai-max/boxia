'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

type Team = { id: string; name: string };
type Space = { id: string; name: string };
type FlatList = { id: string; name: string; folderName?: string };

type Status = {
  connected: boolean;
  scope?: 'user' | 'global';
  defaultList?: { id: string; name: string; workspaceName?: string } | null;
};

export default function ClickUpSettingsPage() {
  const router = useRouter();

  const [status, setStatus] = useState<Status | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [lists, setLists] = useState<FlatList[] | null>(null);

  const [teamId, setTeamId] = useState<string>('');
  const [spaceId, setSpaceId] = useState<string>('');
  const [listId, setListId] = useState<string>('');

  const [loading, setLoading] = useState<'teams' | 'spaces' | 'lists' | null>('teams');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    api.get<Status>('/clickup/status').then(setStatus).catch(() => setStatus({ connected: false }));
  }, []);

  useEffect(() => {
    if (status === null) return;
    if (!status.connected) {
      router.replace('/settings');
      return;
    }
    // Se está usando default global do app, não tem sentido listar workspaces do user
    // (ele pode nem ter integração OAuth própria). Apenas mostra a lista ativa.
    if (status.scope === 'global') {
      setLoading(null);
      return;
    }
    setLoading('teams');
    api.get<{ teams: Team[] }>('/clickup/workspaces')
      .then((r) => setTeams(r.teams))
      .catch((e) => handleApiError(e))
      .finally(() => setLoading(null));
  }, [status, router]);

  function handleApiError(e: unknown) {
    const msg = (e as Error).message;
    if (msg.includes('clickup_disconnected') || msg.includes('clickup_not_configured')) {
      setAuthError(true);
    } else {
      flash(msg || 'erro ao falar com o ClickUp', 'error');
    }
  }

  function flash(msg: string, tone: 'success' | 'error' = 'success') {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  }

  async function pickTeam(id: string) {
    setTeamId(id); setSpaceId(''); setListId('');
    setSpaces(null); setLists(null);
    if (!id) return;
    setLoading('spaces');
    try {
      const r = await api.get<{ spaces: Space[] }>(`/clickup/spaces?teamId=${encodeURIComponent(id)}`);
      setSpaces(r.spaces);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(null);
    }
  }

  async function pickSpace(id: string) {
    setSpaceId(id); setListId('');
    setLists(null);
    if (!id) return;
    setLoading('lists');
    try {
      const r = await api.get<{ lists: FlatList[] }>(`/clickup/lists?spaceId=${encodeURIComponent(id)}`);
      setLists(r.lists);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(null);
    }
  }

  async function save() {
    if (!teamId || !spaceId || !listId || !teams || !lists) return;
    const team = teams.find((t) => t.id === teamId);
    const list = lists.find((l) => l.id === listId);
    if (!team || !list) return;
    setSaving(true);
    try {
      await api.put('/clickup/default-list', {
        workspaceId: teamId,
        workspaceName: team.name,
        spaceId,
        listId,
        listName: list.folderName ? `${list.folderName} / ${list.name}` : list.name,
      });
      flash('lista padrão salva ✓');
      setTimeout(() => router.push('/settings'), 700);
    } catch (e) {
      handleApiError(e);
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!confirm('Desconectar ClickUp? Você precisará autorizar de novo pra aprovar respostas.')) return;
    try {
      await api.del('/clickup/integration');
      flash('desconectado');
      setTimeout(() => router.push('/settings'), 700);
    } catch (e) {
      handleApiError(e);
    }
  }

  async function reconnect() {
    try {
      const r = await api.get<{ url: string }>('/clickup/oauth/start');
      window.location.href = r.url;
    } catch (e) {
      handleApiError(e);
    }
  }

  return (
    <AppShell>
      <PageHeader back onBack={() => router.push('/settings')} title="ClickUp" subtitle="onde criar as tasks" />

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-3">
        {authError && (
          <Card padded>
            <div className="text-[14px] mb-2 font-medium">Conexão expirou</div>
            <div className="text-[13px] text-[color:var(--color-muted)] mb-3">
              O ClickUp recusou o token. Reconecte pra continuar.
            </div>
            <Button variant="primary" size="md" onClick={reconnect}>
              <Icon.Plug width={16} height={16} /> Reconectar
            </Button>
          </Card>
        )}

        {!authError && status?.defaultList && (
          <Card padded>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="success">atual</Badge>
              {status.scope === 'global' && <Badge tone="info">configurada pelo admin</Badge>}
            </div>
            <div className="text-[14px] font-medium">{status.defaultList.name}</div>
            {status.defaultList.workspaceName && (
              <div className="text-[12px] text-[color:var(--color-muted)] mt-0.5">
                workspace: {status.defaultList.workspaceName}
              </div>
            )}
            {status.scope === 'global' && (
              <div className="text-[12px] text-[color:var(--color-muted)] mt-2">
                Todos os approves caem nesta lista. Se quiser usar sua própria conta,
                conecte via OAuth na tela anterior.
              </div>
            )}
          </Card>
        )}

        {!authError && status?.scope !== 'global' && (
          <Card padded className="flex flex-col gap-3">
            <div>
              <label className="text-[12px] font-medium text-[color:var(--color-muted)] uppercase tracking-wider">
                Workspace
              </label>
              <Select
                disabled={loading === 'teams' || !teams}
                value={teamId}
                onChange={(e) => pickTeam(e.target.value)}
                placeholder={loading === 'teams' ? 'carregando...' : 'selecione um workspace'}
                options={teams?.map((t) => ({ value: t.id, label: t.name })) ?? []}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[color:var(--color-muted)] uppercase tracking-wider">
                Space
              </label>
              <Select
                disabled={!teamId || loading === 'spaces' || !spaces}
                value={spaceId}
                onChange={(e) => pickSpace(e.target.value)}
                placeholder={
                  !teamId ? 'escolha um workspace primeiro'
                  : loading === 'spaces' ? 'carregando...'
                  : 'selecione um space'
                }
                options={spaces?.map((s) => ({ value: s.id, label: s.name })) ?? []}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[color:var(--color-muted)] uppercase tracking-wider">
                Lista
              </label>
              <Select
                disabled={!spaceId || loading === 'lists' || !lists}
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                placeholder={
                  !spaceId ? 'escolha um space primeiro'
                  : loading === 'lists' ? 'carregando...'
                  : 'selecione uma lista'
                }
                options={lists?.map((l) => ({
                  value: l.id,
                  label: l.folderName ? `${l.folderName} / ${l.name}` : l.name,
                })) ?? []}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              full
              disabled={!listId || saving}
              onClick={save}
            >
              <Icon.Check width={16} height={16} /> {saving ? 'salvando...' : 'Salvar como padrão'}
            </Button>
          </Card>
        )}

        {status?.scope !== 'global' && status?.connected && (
          <div className="mt-2">
            <Button variant="ghost" size="md" full onClick={disconnect} className="text-[color:var(--color-danger)]">
              <Icon.Logout width={16} height={16} /> Desconectar ClickUp
            </Button>
          </div>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 h-10 rounded-full flex items-center text-[13px] font-medium text-white anim-in z-50"
          style={{ background: toast.tone === 'error' ? 'var(--color-danger)' : 'var(--color-ink)' }}
        >
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}

function Select({
  value, onChange, placeholder, options, disabled,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="mt-1.5 h-12 w-full px-3.5 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[15px] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 transition-all disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
