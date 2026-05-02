'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Card } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

type Step = { id: string; label: string; done: boolean; active: boolean };

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState<'queued' | 'processing' | 'ready' | 'failed'>('queued');
  const [total, setTotal] = useState<number | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { id: 'upload', label: 'Recebemos seu arquivo', done: false, active: true },
    { id: 'enviando', label: 'Mandando pra BoxIA ler', done: false, active: false },
    { id: 'extraindo', label: 'Encontrando as caixinhas', done: false, active: false },
    { id: 'classificando', label: 'Organizando por importância', done: false, active: false },
  ]);

  useEffect(() => {
    const url = `${api.url}/sessions/${id}/stream`;
    const token = api.getToken();
    if (!token) return;
    const ctrl = new AbortController();
    fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then(async (res) => {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';
          for (const part of parts) {
            if (!part.startsWith('data:')) continue;
            try { handleEvent(JSON.parse(part.slice(5).trim())); } catch {}
          }
        }
      }).catch(() => {});

    return () => ctrl.abort();

    function handleEvent(ev: { type: string; status?: string; pct?: number; total?: number; step?: string; done?: boolean }) {
      if (ev.type === 'status' && ev.status) {
        setStatus(ev.status as typeof status);
        if (ev.status === 'ready') setTimeout(() => router.replace(`/sessions/${id}`), 900);
      }
      if (ev.type === 'progress' && typeof ev.pct === 'number') setPct(ev.pct);
      if (ev.type === 'caixinhas-extracted' && typeof ev.total === 'number') setTotal(ev.total);
      if (ev.type === 'step' && ev.step) {
        setSteps((cur) => {
          const matchIdx = cur.findIndex((s) => ev.step!.toLowerCase().includes(s.id));
          if (matchIdx === -1) return cur;
          return cur.map((s, i) => {
            if (i === matchIdx) return { ...s, done: !!ev.done, active: !ev.done };
            if (i < matchIdx) return { ...s, done: true, active: false };
            if (i === matchIdx + 1 && ev.done) return { ...s, active: true };
            return s;
          });
        });
      }
    }
  }, [id, router]);

  return (
    <AppShell>
      <PageHeader
        title="A BoxIA tá lendo"
        subtitle="só uns minutinhos"
        trailing={
          <button
            onClick={() => router.push('/home')}
            className="text-[13px] font-medium text-[color:var(--color-muted)] px-3 py-2"
          >
            depois
          </button>
        }
      />

      <div className="flex-1 px-5 pb-3 flex flex-col gap-6 justify-center">
        {/* Visual central */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-5">
            {status !== 'failed' && status !== 'ready' && (
              <>
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-40"
                  style={{ background: 'var(--color-brand)' }}
                />
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-2xl"
                  style={{ background: 'var(--color-brand)' }}
                />
              </>
            )}
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: status === 'failed' ? 'var(--color-danger-soft)' : status === 'ready' ? 'var(--color-success-soft)' : 'var(--color-brand-soft)',
                color: status === 'failed' ? 'var(--color-danger)' : status === 'ready' ? 'var(--color-success)' : 'var(--color-brand-strong)',
              }}
            >
              {status === 'ready' ? <Icon.Check width={32} height={32} strokeWidth={2.5} /> :
               status === 'failed' ? <Icon.Close width={32} height={32} strokeWidth={2.5} /> :
               <Icon.Sparkle width={32} height={32} strokeWidth={2} />}
            </div>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-tight">
            {status === 'failed' ? 'Deu ruim' : status === 'ready' ? 'Pronto!' : 'Lendo as caixinhas'}
          </h2>

          {total !== null && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[13px] font-semibold"
              style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
            >
              <Icon.Check width={14} height={14} strokeWidth={2.5} />
              {total} caixinhas encontradas
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-line)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: status === 'failed' ? 'var(--color-danger)' : 'var(--color-brand)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[12px] text-[color:var(--color-muted)]">
            <span>{pct}%</span>
            <span className="capitalize">{status}</span>
          </div>
        </div>

        {/* Steps */}
        <Card padded={false} className="p-4">
          <div className="flex flex-col gap-3">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-[14px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: s.done ? 'var(--color-success-soft)' : s.active ? 'var(--color-brand-soft)' : 'var(--color-surface-2)',
                    color: s.done ? 'var(--color-success)' : s.active ? 'var(--color-brand)' : 'var(--color-muted-2)',
                  }}
                >
                  {s.done ? <Icon.Check width={14} height={14} strokeWidth={2.5} /> : s.active ? (
                    <span className="block w-2 h-2 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
                  ) : (
                    <span className="block w-2 h-2 rounded-full" style={{ background: 'currentColor' }} />
                  )}
                </div>
                <span style={{ color: s.done ? 'var(--color-ink)' : s.active ? 'var(--color-ink)' : 'var(--color-muted-2)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
