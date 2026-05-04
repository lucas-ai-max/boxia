'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './icons';

export function AppShell({ children, withTabBar = false }: { children: ReactNode; withTabBar?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[440px] min-h-[100dvh] flex flex-col bg-[color:var(--color-bg)] sm:my-6 sm:rounded-[28px] sm:overflow-hidden sm:shadow-[var(--shadow-pop)] sm:border sm:border-[color:var(--color-line)] sm:min-h-[calc(100dvh-48px)]">
      <div className="flex-1 flex flex-col overflow-hidden anim-in">{children}</div>
      {withTabBar && <BottomTabBar />}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  trailing,
  onBack,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  back?: boolean;
  trailing?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {back && (
          <button
            onClick={() => onBack ? onBack() : router.back()}
            className="w-9 h-9 -ml-2 -mt-1 rounded-full inline-flex items-center justify-center text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)] transition-colors"
            aria-label="Voltar"
          >
            <Icon.ArrowLeft />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight leading-tight truncate">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-[13px] text-[color:var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </header>
  );
}

function BottomTabBar() {
  const pathname = usePathname() ?? '';
  const tabs = [
    { href: '/home', icon: Icon.Home, label: 'Caixinhas' },
    { href: '/library', icon: Icon.Library, label: 'Respostas' },
    { href: '/metrics', icon: Icon.Chart, label: 'Números' },
    { href: '/settings', icon: Icon.Settings, label: 'Ajustes' },
  ];
  return (
    <nav
      className="border-t border-[color:var(--color-line)] bg-[color:var(--color-surface)]/90 backdrop-blur-xl pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
    >
      <div className="flex items-stretch h-16 px-2">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const I = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: active ? 'var(--color-brand)' : 'var(--color-muted-2)' }}
            >
              <I width={22} height={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10.5px] font-medium tracking-tight">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BoxLogo({ size = 22, mark = true }: { size?: number; mark?: boolean }) {
  const markSize = size * 1.15;
  return (
    <span
      className="inline-flex items-center font-[family-name:var(--font-display)] font-bold leading-none antialiased whitespace-nowrap"
      style={{ fontSize: size, letterSpacing: '-0.005em', gap: size * 0.32 }}
    >
      {mark && (
        <span
          aria-hidden
          className="inline-flex items-center justify-center flex-shrink-0"
          style={{
            width: markSize,
            height: markSize,
            background: 'var(--color-brand)',
            color: '#fff',
            borderRadius: markSize * 0.28,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={markSize * 0.62}
            height={markSize * 0.62}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8L12 3 3 8v8l9 5 9-5z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
        </span>
      )}
      <span className="inline-flex items-baseline">
        <span>Box</span>
        <span style={{ color: 'var(--color-brand)', marginLeft: size * 0.04 }}>IA</span>
      </span>
    </span>
  );
}
