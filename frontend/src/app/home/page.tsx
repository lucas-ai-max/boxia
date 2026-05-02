'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, BoxLogo } from '@/components/AppShell';
import { Card, Badge, Avatar } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Session, type Metrics } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.getToken()) { router.replace('/'); return; }
    Promise.all([
      api.get<{ sessions: Session[] }>('/sessions'),
      api.get<Metrics>('/metrics'),
    ]).then(([s, m]) => { setSessions(s.sessions); setMetrics(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const ragTotal = metrics?.rag.total ?? 0;
  const ragHealthy = ragTotal >= 30;

  return (
    <AppShell withTabBar>
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size={40} />
          <div>
            <div className="text-[12px] text-[color:var(--color-muted)] leading-tight">olá,</div>
            <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold leading-tight">criador(a)</div>
          </div>
        </div>
        <BoxLogo size={18} />
      </header>

      <div className="px-5 pb-4">
        <div
          className="relative rounded-[20px] p-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2620 100%)' }}
        >
          <div
            className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ background: 'var(--color-brand)' }}
          />
          <div className="relative flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: ragHealthy ? '#4ade80' : 'var(--color-brand)' }}
            />
            <span className="text-[12px] text-white/70 font-medium">Suas respostas salvas</span>
          </div>
          <div className="relative flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-[44px] font-bold text-white leading-none tracking-tight">
              {ragTotal}
            </span>
            <span className="text-white/60 text-[14px]">respostas suas</span>
          </div>
          <p className="relative text-[13px] text-white/60 mt-1.5 leading-relaxed">
            {ragHealthy
              ? 'a BoxIA já aprendeu seu jeito de responder'
              : `salve mais ${30 - ragTotal} respostas pra BoxIA pegar seu jeito`}
          </p>
          <div className="relative mt-4 flex gap-2">
            <Link href="/sessions/new" className="flex-1">
              <button className="w-full h-11 px-4 rounded-[12px] bg-[color:var(--color-brand)] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-brand-hover)] transition-all active:scale-[0.98]">
                <Icon.Plus width={18} height={18} /> Nova caixinha
              </button>
            </Link>
            <Link href="/library/import">
              <button className="h-11 px-4 rounded-[12px] bg-white/10 text-white text-[14px] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white/15 transition-all active:scale-[0.98] backdrop-blur-sm">
                <Icon.Upload width={16} height={16} /> Adicionar
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[color:var(--color-muted)] uppercase tracking-wider">
          Caixinhas recentes
        </h2>
        {metrics && metrics.usageRate > 0 && (
          <Badge tone="brand">{metrics.usageRate}% usadas</Badge>
        )}
      </div>

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-2.5">
        {loading && <SessionSkeleton />}
        {!loading && sessions.length === 0 && (
          <Card padded={false} className="p-8 text-center border-dashed">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}
            >
              <Icon.Box width={22} height={22} />
            </div>
            <div className="font-medium text-[14px]">Você ainda não subiu caixinhas</div>
            <div className="text-[12px] text-[color:var(--color-muted)] mt-1">
              grava no celular, sobe aqui e a IA responde
            </div>
          </Card>
        )}
        {sessions.map((s) => (
          <Link key={s.id} href={s.status === 'ready' ? `/sessions/${s.id}` : `/sessions/${s.id}/processing`}>
            <Card interactive padded={false} className="p-3.5 flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center font-[family-name:var(--font-display)] text-[18px] font-bold flex-shrink-0"
                style={{
                  background: 'var(--color-brand-soft)',
                  color: 'var(--color-brand-strong)',
                }}
              >
                {s.totalCaixinhas}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {s.source === 'video'
                    ? <Icon.Video width={14} height={14} />
                    : <Icon.Image width={14} height={14} />}
                  <span className="font-medium text-[14px] truncate">
                    {s.source === 'video' ? 'Vídeo' : 'Prints'}
                    {s.historical && ' · antigas'}
                  </span>
                  {s.status === 'processing' && <Badge tone="info">lendo...</Badge>}
                  {s.status === 'failed' && <Badge tone="danger">erro</Badge>}
                </div>
                <div className="text-[12px] text-[color:var(--color-muted)]">
                  {fmtDate(s.createdAt)} · {s.totalCaixinhas} caixinhas
                </div>
              </div>
              <Icon.ChevronRight width={18} height={18} className="text-[color:var(--color-muted-2)]" />
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function SessionSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[68px] rounded-[16px] bg-[color:var(--color-surface-2)] animate-pulse" />
      ))}
    </>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `hoje, ${d.toTimeString().slice(0, 5)}`;
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
