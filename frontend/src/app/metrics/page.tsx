'use client';
import { useEffect, useState } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Card, Badge } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Metrics } from '@/lib/api';

export default function MetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Metrics>('/metrics').then(setM).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell withTabBar>
        <PageHeader title="Seus números" />
        <div className="flex-1 px-5 pb-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => <div key={i} className="h-[100px] rounded-[16px] bg-[color:var(--color-surface-2)] animate-pulse" />)}
          </div>
          <div className="h-[160px] rounded-[16px] bg-[color:var(--color-surface-2)] animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!m) return null;

  return (
    <AppShell withTabBar>
      <PageHeader title="Seus números" subtitle="como a BoxIA tá te ajudando" />

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Caixinhas lidas"
            value={m.totalCaixinhas}
            color="ink"
          />
          <StatCard
            label="Respostas que você usou"
            value={`${m.usageRate}%`}
            color="brand"
            badge={m.usageRate >= 60 ? 'ótimo' : undefined}
          />
        </div>

        <Card padded>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
              Sua evolução
            </h3>
            <Icon.Chart width={16} height={16} className="text-[color:var(--color-muted-2)]" />
          </div>
          <SparkLine data={m.weekly} />
          <div className="flex justify-between mt-2 text-[11px] text-[color:var(--color-muted-2)]">
            {(m.weekly.length > 0 ? m.weekly : Array(5).fill(null)).slice(-5).map((_, i, arr) => (
              <span key={i}>{i === arr.length - 1 ? 'agora' : `sem ${i + 1}`}</span>
            ))}
          </div>
        </Card>

        <Card padded>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
            >
              <Icon.Library width={18} height={18} />
            </div>
            <div className="flex-1">
              <div className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight">
                Suas respostas salvas
              </div>
              <div className="text-[12px] text-[color:var(--color-muted)]">{m.rag.total} no total</div>
            </div>
            <Badge tone={m.rag.total >= 30 ? 'success' : 'warning'}>
              {m.rag.total >= 30 ? 'pronto' : 'crescendo'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <RagBar label="Você digitou" value={m.rag.manual} total={m.rag.total} />
            <RagBar label="Salvas auto" value={m.rag.autoImported} total={m.rag.total} />
          </div>
        </Card>

        <Card padded={false} className="p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}
          >
            <Icon.Box width={18} height={18} />
          </div>
          <div className="flex-1">
            <div className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight">
              {m.sessionsCount} caixinhas subidas
            </div>
            <div className="text-[12px] text-[color:var(--color-muted)]">total no histórico</div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color, badge }: { label: string; value: string | number; color: 'ink' | 'brand'; badge?: string }) {
  return (
    <Card padded className="relative">
      {badge && (
        <Badge tone="success" className="absolute top-3 right-3 text-[10px] h-5 px-1.5">
          {badge}
        </Badge>
      )}
      <div
        className="font-[family-name:var(--font-display)] text-[40px] font-bold leading-none tracking-tight tabular-nums"
        style={{ color: color === 'brand' ? 'var(--color-brand)' : 'var(--color-ink)' }}
      >
        {value}
      </div>
      <div className="text-[12px] text-[color:var(--color-muted)] mt-2 leading-tight">
        {label}
      </div>
    </Card>
  );
}

function RagBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] text-[color:var(--color-muted)]">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-line)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--color-brand)' }}
        />
      </div>
    </div>
  );
}

function SparkLine({ data }: { data: { used: number; total: number }[] }) {
  if (!data.length) {
    return (
      <div
        className="h-[100px] rounded-[12px] flex items-center justify-center text-[12px] text-[color:var(--color-muted-2)]"
        style={{ background: 'var(--color-surface-2)' }}
      >
        sem dados ainda — comece a usar respostas pra ver
      </div>
    );
  }
  const ratios = data.map((d) => (d.total > 0 ? (d.used / d.total) * 100 : 0));
  const max = Math.max(100, ...ratios);
  const W = 280, H = 100, padX = 10, padY = 12;
  const innerW = W - padX * 2, innerH = H - padY * 2;
  const points = ratios.map((r, i) => {
    const x = padX + (i / Math.max(1, ratios.length - 1)) * innerW;
    const y = padY + innerH - (r / max) * innerH;
    return [x, y] as const;
  });
  const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const fillStr = `${pathStr} L${points[points.length - 1]![0]},${H - padY} L${points[0]![0]},${H - padY} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fillStr} fill="url(#g1)" />
      <path d={pathStr} stroke="var(--color-brand)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5} fill="var(--color-brand)" />
      ))}
    </svg>
  );
}
