'use client';
import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Chip, ScoreRing, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Caixinha, type Session } from '@/lib/api';
import { useTaxonomy } from '@/lib/taxonomy';

type Filter = 'todas' | 'categoria';

export default function SessionResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const taxonomy = useTaxonomy();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Caixinha[]>([]);
  const [filter, setFilter] = useState<Filter>('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ session: Session; caixinhas: Caixinha[] }>(`/sessions/${id}`)
      .then((r) => { setSession(r.session); setItems(r.caixinhas); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const counts = useMemo(() => ({
    total: items.length,
  }), [items]);

  const visible = useMemo(() => {
    if (filter === 'categoria') {
      return [...items].sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''));
    }
    return items;
  }, [items, filter]);

  if (session?.historical) return <HistoricalReview session={session} items={items} />;

  return (
    <AppShell withTabBar>
      <PageHeader back onBack={() => router.push('/home')} title="Suas caixinhas" subtitle={session?.source === 'video' ? 'do vídeo que você subiu' : 'dos prints que você subiu'} />

      <div className="px-5 pb-3 flex flex-col gap-2.5">
        <div
          className="rounded-[16px] p-4 flex items-center gap-3"
          style={{ background: 'var(--color-brand-soft)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'white', color: 'var(--color-brand-strong)' }}
          >
            <Icon.Check width={20} height={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight leading-tight"
              style={{ color: 'var(--color-brand-strong)' }}
            >
              {session?.totalCaixinhas ?? counts.total} caixinhas encontradas
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-brand-strong)', opacity: 0.7 }}>
              já organizadas pela BoxIA · responda primeiro as mais importantes
            </div>
          </div>
        </div>

        {session?.promptQuestion && (
          <Card padded={false} className="p-3 flex items-start gap-2.5">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mt-0.5 flex-shrink-0">
              sua pergunta
            </div>
            <div className="flex-1 text-[13px] leading-snug font-medium">
              "{session.promptQuestion}"
            </div>
          </Card>
        )}
      </div>

      <div className="px-5 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>
          Todas <span className="opacity-60 ml-1">{counts.total}</span>
        </Chip>
        <Chip active={filter === 'categoria'} onClick={() => setFilter('categoria')}>
          Por tipo
        </Chip>
      </div>

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-2.5">
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[88px] rounded-[16px] bg-[color:var(--color-surface-2)] animate-pulse" />
            ))}
          </>
        )}
        {!loading && visible.map((c) => (
          <Link key={c.id} href={`/sessions/${id}/caixinhas/${c.id}`}>
            <Card interactive padded={false} className="p-4 flex items-start gap-3.5">
              <ScoreRing score={c.score} size={42} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  {c.category && (
                    <Badge tone="neutral">{taxonomy.categoryLabel(c.category)}</Badge>
                  )}
                  {Object.entries(c.flags)
                    .filter(([, v]) => v)
                    .map(([slug]) => (
                      <Badge key={slug} tone="brand">{taxonomy.flagLabel(slug)}</Badge>
                    ))}
                </div>
                {c.autorNome && (
                  <div className="text-[12px] font-semibold text-[color:var(--color-ink-2)] mb-0.5 truncate">
                    {c.autorNome}
                  </div>
                )}
                <p className="text-[14px] leading-snug text-[color:var(--color-muted)] line-clamp-2">
                  "{c.pergunta}"
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {c.approval && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-success)', color: 'white' }}
                    title="Enviada pro ClickUp"
                  >
                    <Icon.Check width={11} height={11} strokeWidth={3} />
                  </div>
                )}
                <Icon.ChevronRight width={18} height={18} className="text-[color:var(--color-muted-2)] mt-0.5" />
              </div>
            </Card>
          </Link>
        ))}
        {!loading && visible.length === 0 && (
          <Card padded className="text-center text-[13px] text-[color:var(--color-muted)]">
            nenhuma caixinha aqui
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function HistoricalReview({ session, items }: { session: Session; items: Caixinha[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const filledCount = Object.values(answers).filter((v) => v?.trim()).length;

  async function saveAll() {
    setSaving(true);
    try {
      const filled = items.filter((i) => answers[i.id]?.trim());
      for (const item of filled) {
        await api.put(`/caixinhas/historical/${item.id}/answer`, { answer: answers[item.id] });
      }
      router.push('/library');
    } finally { setSaving(false); }
  }

  return (
    <AppShell>
      <PageHeader
        title="Suas respostas antigas"
        subtitle="cole o que você respondeu em cada uma"
        trailing={
          <button onClick={() => router.push('/home')} className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]">
            <Icon.Close />
          </button>
        }
      />

      <div className="px-5 pb-3">
        <div
          className="rounded-[16px] p-3.5 flex items-center gap-3"
          style={{ background: 'var(--color-brand-soft)' }}
        >
          <Icon.Check width={20} height={20} style={{ color: 'var(--color-brand-strong)' }} strokeWidth={2.5} />
          <div className="flex-1">
            <div className="font-semibold text-[14px]" style={{ color: 'var(--color-brand-strong)' }}>
              {session.totalCaixinhas} caixinhas encontradas
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-brand-strong)', opacity: 0.7 }}>
              quanto mais respostas suas, melhor a BoxIA imita seu jeito
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-3">
        {items.map((c, idx) => (
          <Card key={c.id} padded={false} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge tone="neutral">#{idx + 1}</Badge>
              {c.autorNome && (
                <span className="text-[12px] font-semibold text-[color:var(--color-ink-2)]">{c.autorNome}</span>
              )}
            </div>
            <p className="text-[14px] leading-snug mb-3 text-[color:var(--color-ink-2)]">
              "{c.pergunta}"
            </p>
            <Textarea
              placeholder="cole/escreva o que você respondeu..."
              value={answers[c.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
              rows={2}
              className="min-h-[60px]"
            />
          </Card>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
        <Button variant="primary" size="lg" full onClick={saveAll} disabled={saving || filledCount === 0}>
          {saving ? 'Salvando...' : filledCount === 0 ? 'Preencha pelo menos 1 resposta' : `Salvar ${filledCount} ${filledCount > 1 ? 'respostas' : 'resposta'}`}
        </Button>
      </div>
    </AppShell>
  );
}
