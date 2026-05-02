'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Avatar } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

type RowProps = {
  href?: string;
  icon: React.ReactNode;
  title: string;
  desc?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
};

function Row({ href, icon, title, desc, trailing, onClick }: RowProps) {
  const inner = (
    <Card interactive padded={false} className="p-4 flex items-center gap-3.5">
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-ink-2)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[14px] truncate">{title}</div>
        {desc && <div className="text-[12px] text-[color:var(--color-muted)] mt-0.5 truncate">{desc}</div>}
      </div>
      {trailing ?? <Icon.ChevronRight width={16} height={16} className="text-[color:var(--color-muted-2)]" />}
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="text-left w-full">{inner}</button>;
  return inner;
}

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ email: string; displayName: string | null } | null>(null);
  const [health, setHealth] = useState<{ iaReady: boolean } | null>(null);

  useEffect(() => {
    api.get<{ email: string; displayName: string | null }>('/auth/me').then(setMe).catch(() => router.replace('/'));
    api.get<{ iaReady: boolean }>('/health').then(setHealth).catch(() => {});
  }, [router]);

  function logout() {
    api.setToken(null);
    router.replace('/');
  }

  return (
    <AppShell withTabBar>
      <PageHeader title="Ajustes" />

      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll flex flex-col gap-3">
        <Card padded className="flex items-center gap-3">
          <Avatar size={48} name={me?.displayName ?? me?.email ?? 'BoxIA'} />
          <div className="flex-1 min-w-0">
            <div className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight truncate">
              {me?.displayName ?? 'sua conta'}
            </div>
            <div className="text-[12px] text-[color:var(--color-muted)] truncate">{me?.email}</div>
          </div>
        </Card>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)] mb-2 px-1">
            Personalização
          </h3>
          <div className="flex flex-col gap-2">
            <Row
              href="/onboarding/dna"
              icon={<Icon.Sparkle width={18} height={18} />}
              title="Como você fala"
              desc="seu jeito pra IA imitar"
            />
            <Row
              href="/library"
              icon={<Icon.Library width={18} height={18} />}
              title="Suas respostas"
              desc="biblioteca de respostas suas"
            />
          </div>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)] mb-2 px-1">
            Sistema
          </h3>
          <Row
            icon={<Icon.Bolt width={18} height={18} />}
            title="BoxIA"
            desc={health?.iaReady ? 'pronta pra usar' : 'aguardando configuração'}
            trailing={<Badge tone={health?.iaReady ? 'success' : 'warning'}>{health?.iaReady ? 'online' : 'offline'}</Badge>}
          />
        </div>

        <div className="mt-2">
          <Button variant="ghost" size="md" full onClick={logout} className="text-[color:var(--color-danger)]">
            <Icon.Logout width={16} height={16} /> Sair
          </Button>
        </div>

        <div className="mt-auto pt-6 text-center text-[11px] text-[color:var(--color-muted-2)]">
          BoxIA v0.1 · feito com 🧡 pra criadores
        </div>
      </div>
    </AppShell>
  );
}
