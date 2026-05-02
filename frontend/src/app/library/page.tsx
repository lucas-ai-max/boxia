'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Chip, Input, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type LibraryItem } from '@/lib/api';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'digitada',
  print: 'do print',
  video: 'do vídeo',
  auto_import: 'salva automaticamente',
};
const SOURCE_TONE: Record<string, 'neutral' | 'success' | 'info' | 'brand'> = {
  manual: 'neutral',
  print: 'info',
  video: 'success',
  auto_import: 'brand',
};

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('todas');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState(''); const [newA, setNewA] = useState('');

  function load(query = '') {
    setLoading(true);
    api.get<{ items: LibraryItem[] }>(`/library${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filters = [
    { key: 'todas', label: 'Todas' },
    { key: 'manual', label: 'Digitadas' },
    { key: 'print', label: 'Dos prints' },
    { key: 'video', label: 'Do vídeo' },
    { key: 'auto_import', label: 'Automáticas' },
  ];
  const visible = filter === 'todas' ? items : items.filter((i) => i.source === filter);

  async function addManual() {
    if (!newQ.trim() || !newA.trim()) return;
    await api.post('/library', { question: newQ, answer: newA });
    setNewQ(''); setNewA(''); setAdding(false); load(q);
  }

  async function remove(id: string) {
    if (!confirm('Remover essa resposta?')) return;
    await api.del(`/library/${id}`); load(q);
  }

  const ragHealthy = items.length >= 30;
  const recentCount = items.filter((i) => Date.now() - new Date(i.createdAt).getTime() < 7 * 86400000).length;

  return (
    <AppShell withTabBar>
      <PageHeader title="Suas respostas" subtitle="quanto mais você salva, melhor a IA imita seu jeito" />

      <div className="px-5 pb-3">
        <Card padded={false} className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: ragHealthy ? 'var(--color-success-soft)' : 'var(--color-warning-soft)',
              color: ragHealthy ? 'var(--color-success)' : 'var(--color-warning)',
            }}
          >
            <Icon.Library width={22} height={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight leading-tight">
              {items.length} respostas
            </div>
            <div className="text-[12px] text-[color:var(--color-muted)] mt-0.5">
              {ragHealthy ? 'a BoxIA já pegou seu jeito' : `precisa de pelo menos 30 pra IA pegar seu jeito`}
              {recentCount > 0 && ` · +${recentCount} essa semana`}
            </div>
          </div>
          <Badge tone={ragHealthy ? 'success' : 'warning'}>
            {ragHealthy ? 'pronto' : 'crescendo'}
          </Badge>
        </Card>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <Icon.Search width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-2)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(q)}
            placeholder="buscar..."
            className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[14px] placeholder:text-[color:var(--color-muted-2)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 transition-all"
          />
        </div>
      </div>

      <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-2.5">
        {loading && (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="h-[100px] rounded-[16px] bg-[color:var(--color-surface-2)] animate-pulse" />
            ))}
          </>
        )}
        {!loading && visible.length === 0 && (
          <Card padded={false} className="p-6 text-center border-dashed">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}
            >
              <Icon.Library width={22} height={22} />
            </div>
            <div className="font-medium text-[14px]">Vazio por aqui</div>
            <div className="text-[12px] text-[color:var(--color-muted)] mt-1 mb-4">
              suba prints de caixinhas que você já respondeu, ou digite uma na mão
            </div>
            <div className="flex gap-2 justify-center">
              <Link href="/library/import">
                <Button variant="primary" size="sm">
                  <Icon.Upload width={14} height={14} /> Subir prints
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
                <Icon.Plus width={14} height={14} /> Digitar
              </Button>
            </div>
          </Card>
        )}
        {visible.map((it) => (
          <Card key={it.id} padded={false} className="p-3.5">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <Badge tone={SOURCE_TONE[it.source]}>{SOURCE_LABEL[it.source]}</Badge>
              <button
                onClick={() => remove(it.id)}
                className="text-[color:var(--color-muted-2)] hover:text-[color:var(--color-danger)] -mr-1 -mt-0.5"
              >
                <Icon.Trash width={14} height={14} />
              </button>
            </div>
            <div className="text-[13px] font-medium text-[color:var(--color-ink-2)] leading-snug mb-1.5">
              <span className="text-[color:var(--color-muted-2)] mr-1">Perguntaram:</span>{it.question}
            </div>
            <div className="text-[13px] leading-snug text-[color:var(--color-muted)]">
              <span className="text-[color:var(--color-muted-2)] mr-1">Você:</span>{it.answer}
            </div>
          </Card>
        ))}

        {adding && (
          <Card padded className="border-2" style={{ borderColor: 'var(--color-brand)' }}>
            <div className="text-[13px] font-semibold mb-2.5">Nova resposta sua</div>
            <div className="flex flex-col gap-2.5">
              <Input
                placeholder='ex.: "qual creme você usa?"'
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
              />
              <Textarea
                placeholder="o que você respondeu"
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewQ(''); setNewA(''); }}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={addManual} disabled={!newQ.trim() || !newA.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)] flex gap-2">
        <Button variant="secondary" size="md" full onClick={() => router.push('/library/import')}>
          <Icon.Upload width={16} height={16} /> Subir prints
        </Button>
        <Button variant="primary" size="md" full onClick={() => setAdding(true)}>
          <Icon.Plus width={16} height={16} /> Digitar
        </Button>
      </div>
    </AppShell>
  );
}
