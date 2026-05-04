'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, BoxLogo } from '@/components/AppShell';
import { Card, Badge, Avatar } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Session, type Metrics } from '@/lib/api';

const SWIPE_ACTION_WIDTH = 88;
const SWIPE_OPEN_THRESHOLD = 40;
const SWIPE_TAP_TOLERANCE = 6;

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!api.getToken()) { router.replace('/'); return; }
    Promise.all([
      api.get<{ sessions: Session[] }>('/sessions'),
      api.get<Metrics>('/metrics'),
    ]).then(([s, m]) => { setSessions(s.sessions); setMetrics(m); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleDelete(id: string) {
    if (!window.confirm('Apagar essa sessão e todas as caixinhas dela?')) return;
    setDeletingId(id);
    try {
      await api.del(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setOpenId(null);
    } catch {
      window.alert('Não foi possível apagar. Tenta de novo.');
    } finally {
      setDeletingId(null);
    }
  }

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
          <SessionRow
            key={s.id}
            s={s}
            isOpen={openId === s.id}
            deleting={deletingId === s.id}
            onOpen={() => setOpenId(s.id)}
            onClose={() => setOpenId((curr) => (curr === s.id ? null : curr))}
            onDelete={() => handleDelete(s.id)}
            onNavigate={(href) => router.push(href)}
          />
        ))}
      </div>
    </AppShell>
  );
}

function SessionRow({
  s, isOpen, deleting, onOpen, onClose, onDelete, onNavigate,
}: {
  s: Session;
  isOpen: boolean;
  deleting: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  onNavigate: (href: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swiped = useRef(false);
  const cancelled = useRef(false);

  const baseX = isOpen ? -SWIPE_ACTION_WIDTH : 0;
  const tx = isDragging
    ? Math.min(0, Math.max(-SWIPE_ACTION_WIDTH * 1.2, baseX + dragX))
    : baseX;

  const href = s.status === 'ready' ? `/sessions/${s.id}` : `/sessions/${s.id}/processing`;

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]!;
    startX.current = t.clientX;
    startY.current = t.clientY;
    swiped.current = false;
    cancelled.current = false;
    setDragX(0);
    setIsDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (cancelled.current) return;
    const t = e.touches[0]!;
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (!swiped.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      cancelled.current = true;
      setIsDragging(false);
      return;
    }
    if (Math.abs(dx) > SWIPE_TAP_TOLERANCE) swiped.current = true;
    setDragX(dx);
  }

  function endDrag() {
    if (!isDragging) return;
    if (!cancelled.current) {
      const finalX = baseX + dragX;
      if (finalX < -SWIPE_OPEN_THRESHOLD) onOpen();
      else onClose();
    }
    setIsDragging(false);
    setDragX(0);
  }

  function onClick(e: React.MouseEvent) {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
      return;
    }
    if (isOpen) {
      e.preventDefault();
      onClose();
      return;
    }
    onNavigate(href);
  }

  return (
    <div className="relative overflow-hidden rounded-[16px]">
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Excluir sessão"
        className="absolute right-0 top-0 bottom-0 inline-flex flex-col items-center justify-center gap-1 text-white text-[12px] font-semibold disabled:opacity-60"
        style={{ width: SWIPE_ACTION_WIDTH, background: '#dc2626' }}
      >
        <Icon.Trash width={20} height={20} />
        <span>Excluir</span>
      </button>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
        onClick={onClick}
        style={{
          transform: `translateX(${tx}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s ease-out',
          touchAction: 'pan-y',
        }}
        className="relative cursor-pointer select-none"
      >
        <Card interactive padded={false} className="p-3.5 flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center font-[family-name:var(--font-display)] text-[18px] font-bold flex-shrink-0"
            style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
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
      </div>
    </div>
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
