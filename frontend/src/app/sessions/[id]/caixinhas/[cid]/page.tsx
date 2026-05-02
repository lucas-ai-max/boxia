'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Chip, ScoreRing } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Caixinha, type Generation, type Session } from '@/lib/api';

type GenResponse = {
  generation: Generation;
  inspiredBy: { id: string; question: string; answer: string }[];
};

const CATEGORY_LABEL: Record<string, string> = {
  'duvida-produto': 'dúvida sobre produto',
  'pedido-conteudo': 'pediu conteúdo',
  'elogio': 'elogio',
  'feedback-construtivo': 'feedback',
  'oportunidade-lead': 'lead em potencial',
  'pergunta-pessoal': 'pergunta pessoal',
  'ruido': 'sem prioridade',
  'sensivel': 'cuidado',
};

const REGEN_OPTIONS = [
  'mais curta', 'mais informal', 'mais técnica', 'com humor', '+ emoji',
];

export default function CaixinhaDetailPage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = use(params);
  const router = useRouter();
  const [caixinha, setCaixinha] = useState<Caixinha | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [siblings, setSiblings] = useState<Caixinha[]>([]);
  const [data, setData] = useState<GenResponse | null>(null);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [showInspired, setShowInspired] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ session: Session; caixinhas: Caixinha[] }>(`/sessions/${id}`).then((r) => {
      setSession(r.session);
      setSiblings(r.caixinhas);
      setCaixinha(r.caixinhas.find((x) => x.id === cid) ?? null);
    });
  }, [id, cid]);

  useEffect(() => {
    setGenerating(true); setActive(0); setEditing(null); setShowInspired(false); setGenError(null);
    (async () => {
      try {
        const cached = await api.get<GenResponse | undefined>(`/caixinhas/${cid}/generation`);
        if (cached?.generation) { setData(cached); return; }
        const fresh = await api.post<GenResponse>(`/caixinhas/${cid}/generate`);
        setData(fresh);
      } catch (e) {
        setGenError((e as Error).message);
      } finally {
        setGenerating(false);
      }
    })();
  }, [cid]);

  async function regenerate(modifier?: string) {
    setGenerating(true); setGenError(null);
    try {
      const r = await api.post<GenResponse>(`/caixinhas/${cid}/generate`, { modifier });
      setData(r); setActive(0); setEditing(null);
    } catch (e) {
      setGenError((e as Error).message);
    } finally { setGenerating(false); }
  }

  async function feedback(action: 'like' | 'edit' | 'discard' | 'copy', finalText?: string) {
    if (!data) return;
    try {
      await api.post('/feedback', {
        generationId: data.generation.id,
        suggestionIndex: active,
        action,
        finalText,
      });
      if (action === 'copy' && finalText) {
        try { await navigator.clipboard.writeText(finalText); } catch {}
        navigator.vibrate?.(20);
        showToast('Copiada!');
      } else if (action === 'like') showToast('Anotado — vou usar mais isso 👍');
      else if (action === 'discard') showToast('Não vou usar de novo');
      else if (action === 'edit') showToast('Sua versão foi salva');
    } catch {}
  }

  function showToast(msg: string) {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 1800);
  }

  const idx = caixinha ? siblings.findIndex((s) => s.id === caixinha.id) : -1;

  if (!caixinha) {
    return (
      <AppShell>
        <PageHeader back onBack={() => router.push(`/sessions/${id}`)} title="..." />
        <div className="flex-1 px-5 flex items-center justify-center">
          <div className="text-[13px] text-[color:var(--color-muted)]">carregando...</div>
        </div>
      </AppShell>
    );
  }

  const suggestions = data?.generation.suggestions ?? [];
  const current = editing !== null ? editing : (suggestions[active] ?? '');

  return (
    <AppShell>
      <PageHeader
        back
        onBack={() => router.push(`/sessions/${id}`)}
        title={`Caixinha ${idx + 1}/${siblings.length}`}
        subtitle={CATEGORY_LABEL[caixinha.category] ?? caixinha.category}
      />

      <div className="px-5 pb-4 flex flex-col gap-2.5">
        {session?.promptQuestion && (
          <Card padded={false} className="p-3 flex items-start gap-2.5" style={{ background: 'var(--color-surface-2)' }}>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mt-0.5 flex-shrink-0 leading-tight">
              sua<br />pergunta
            </div>
            <div className="flex-1 text-[13px] leading-snug font-medium">
              "{session.promptQuestion}"
            </div>
          </Card>
        )}

        <Card padded className="relative overflow-hidden">
          <div
            className="absolute -top-3 -right-3 w-20 h-20 rounded-full opacity-30 blur-2xl"
            style={{ background: 'var(--color-brand)' }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2.5">
              <ScoreRing score={caixinha.score} size={32} />
              {caixinha.flags.urgente && <Badge tone="brand">⚡ urgente</Badge>}
              {caixinha.flags.sensivel && <Badge tone="danger">⚠ delicada</Badge>}
            </div>
            {caixinha.autorNome && (
              <div className="text-[13px] font-semibold text-[color:var(--color-ink-2)] mb-1">
                {caixinha.autorNome} <span className="text-[color:var(--color-muted-2)] font-normal">disse:</span>
              </div>
            )}
            <p className="text-[16px] leading-snug font-medium text-[color:var(--color-ink)]">
              "{caixinha.pergunta}"
            </p>
            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[color:var(--color-muted)]">
              {caixinha.timestampSeconds !== null && (
                <span>⏱ {Math.floor(caixinha.timestampSeconds / 60)}:{(caixinha.timestampSeconds % 60).toString().padStart(2, '0')}</span>
              )}
              <span>✨ {Math.round(caixinha.confidence * 100)}% certeza</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[color:var(--color-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Icon.Sparkle width={14} height={14} /> Respostas no seu jeito
          </h3>
          {suggestions.length > 1 && (
            <span className="text-[12px] text-[color:var(--color-muted)] tabular-nums">
              {active + 1} / {suggestions.length}
            </span>
          )}
        </div>

        {generating && (
          <Card padded className="space-y-2">
            <div className="h-3 rounded-full bg-[color:var(--color-surface-2)] animate-pulse" />
            <div className="h-3 rounded-full bg-[color:var(--color-surface-2)] animate-pulse w-4/5" />
            <div className="h-3 rounded-full bg-[color:var(--color-surface-2)] animate-pulse w-3/5" />
          </Card>
        )}

        {!generating && genError && (
          <Card padded>
            <div className="text-[13px] text-[color:var(--color-danger)] mb-2">{genError}</div>
            <Button size="sm" onClick={() => regenerate()}>
              <Icon.Refresh width={14} height={14} /> Tentar de novo
            </Button>
          </Card>
        )}

        {!generating && !genError && suggestions[active] !== undefined && (
          <Card padded className="border-2" style={{ borderColor: 'var(--color-brand)' }}>
            {editing !== null ? (
              <textarea
                value={editing}
                onChange={(e) => setEditing(e.target.value)}
                className="w-full text-[15px] leading-relaxed bg-transparent border-none outline-none resize-none font-[family-name:var(--font-body)]"
                style={{ minHeight: 100 }}
                autoFocus
              />
            ) : (
              <p className="text-[15px] leading-relaxed text-[color:var(--color-ink)]">
                {suggestions[active]}
              </p>
            )}

            {data?.inspiredBy && data.inspiredBy.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[color:var(--color-line)]">
                <button
                  onClick={() => setShowInspired((s) => !s)}
                  className="text-[12px] text-[color:var(--color-muted)] flex items-center gap-1.5 hover:text-[color:var(--color-ink-2)] transition-colors"
                >
                  <Icon.Sparkle width={12} height={12} />
                  Baseada em {data.inspiredBy.length} respostas suas
                  <Icon.ChevronDown
                    width={12} height={12}
                    style={{ transform: showInspired ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                  />
                </button>
                {showInspired && (
                  <div className="mt-2 flex flex-col gap-2">
                    {data.inspiredBy.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="rounded-[10px] p-2.5 text-[12px] leading-snug border-l-2"
                        style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-brand)' }}
                      >
                        <div className="text-[color:var(--color-muted)] mb-0.5">Pergunta: {p.question}</div>
                        <div className="text-[color:var(--color-ink-2)]">Você: {p.answer}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <FeedbackBtn icon={<Icon.ThumbUp width={16} height={16} />} onClick={() => feedback('like')} title="curti" />
              <FeedbackBtn
                icon={editing === null ? <Icon.Edit width={16} height={16} /> : <Icon.Check width={16} height={16} />}
                onClick={() => {
                  if (editing === null) setEditing(suggestions[active] ?? '');
                  else { feedback('edit', editing); setEditing(null); }
                }}
                title={editing === null ? 'editar' : 'salvar edição'}
              />
              <FeedbackBtn icon={<Icon.Trash width={16} height={16} />} onClick={() => feedback('discard')} danger title="descartar" />
              <Button variant="primary" size="md" full onClick={() => feedback('copy', current)} className="flex-1">
                <Icon.Copy width={16} height={16} /> Copiar
              </Button>
            </div>

            {suggestions.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {suggestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActive(i); setEditing(null); }}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === active ? 20 : 6,
                      background: i === active ? 'var(--color-brand)' : 'var(--color-line)',
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {!generating && !genError && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] text-[color:var(--color-muted)] flex items-center gap-1">
              <Icon.Refresh width={12} height={12} /> mudar pra:
            </span>
            {REGEN_OPTIONS.map((m) => (
              <Chip key={m} onClick={() => regenerate(m)} className="text-[12px] h-7">
                {m}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)] flex gap-2">
        <Button
          variant="secondary"
          size="md"
          full
          disabled={idx <= 0}
          onClick={() => router.push(`/sessions/${id}/caixinhas/${siblings[idx - 1]!.id}`)}
        >
          <Icon.ArrowLeft width={16} height={16} /> Anterior
        </Button>
        <Button
          variant="secondary"
          size="md"
          full
          disabled={idx >= siblings.length - 1}
          onClick={() => router.push(`/sessions/${id}/caixinhas/${siblings[idx + 1]!.id}`)}
        >
          Próxima <Icon.ArrowRight width={16} height={16} />
        </Button>
      </div>

      {feedbackToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 h-10 rounded-full flex items-center text-[13px] font-medium text-white anim-in z-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {feedbackToast}
        </div>
      )}
    </AppShell>
  );
}

function FeedbackBtn({ icon, onClick, danger, title }: { icon: React.ReactNode; onClick: () => void; danger?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-11 h-11 rounded-[12px] inline-flex items-center justify-center transition-all border active:scale-[0.95]"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        color: danger ? 'var(--color-muted)' : 'var(--color-ink-2)',
      }}
    >
      {icon}
    </button>
  );
}
