'use client';
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, HTMLAttributes } from 'react';

// ─── Button ────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-hover)] active:bg-[color:var(--color-brand-strong)] shadow-[0_1px_0_rgba(0,0,0,0.04),0_4px_12px_rgba(255,107,74,0.25)]',
  secondary:
    'bg-[color:var(--color-surface)] text-[color:var(--color-ink)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-surface-2)]',
  ghost:
    'bg-transparent text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-2)]',
  danger:
    'bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] hover:brightness-95',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-[10px] gap-1.5',
  md: 'h-11 px-4 text-[14px] rounded-[12px] gap-2',
  lg: 'h-13 px-5 text-[15px] rounded-[14px] gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  full,
  className = '',
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({
  children, className = '', interactive, padded = true, ...rest
}: { children: ReactNode; className?: string; interactive?: boolean; padded?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`bg-[color:var(--color-surface)] rounded-[16px] border border-[color:var(--color-line)]/60 ${padded ? 'p-4' : ''} ${interactive ? 'transition-all duration-150 hover:border-[color:var(--color-line)] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.995]' : 'shadow-[var(--shadow-card)]'} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────
type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[color:var(--color-surface-2)] text-[color:var(--color-muted)]',
  brand:   'bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]',
  success: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
  warning: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  danger:  'bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]',
  info:    'bg-blue-50 text-blue-700',
};
export function Badge({
  children, tone = 'neutral', className = '', icon,
}: { children: ReactNode; tone?: BadgeTone; className?: string; icon?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-medium tracking-tight whitespace-nowrap ${BADGE_TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Chip (filtro selecionável) ────────────────────────────────────────────
export function Chip({
  children, active, onClick, className = '',
}: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-medium tracking-tight transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-[color:var(--color-ink)] text-white'
          : 'bg-[color:var(--color-surface)] text-[color:var(--color-muted)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-surface-2)]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
export function Input({
  className = '', label, hint, error, ...rest
}: { label?: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-[13px] font-medium text-[color:var(--color-ink-2)]">{label}</span>}
      <input
        {...rest}
        className={`h-12 px-3.5 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[15px] placeholder:text-[color:var(--color-muted-2)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 transition-all ${error ? 'border-[color:var(--color-danger)]' : ''} ${className}`}
      />
      {hint && !error && <span className="text-[12px] text-[color:var(--color-muted)]">{hint}</span>}
      {error && <span className="text-[12px] text-[color:var(--color-danger)]">{error}</span>}
    </label>
  );
}

export function Textarea({
  className = '', label, hint, ...rest
}: { label?: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-[13px] font-medium text-[color:var(--color-ink-2)]">{label}</span>}
      <textarea
        {...rest}
        className={`min-h-[100px] p-3.5 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[15px] leading-snug placeholder:text-[color:var(--color-muted-2)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 resize-none transition-all ${className}`}
      />
      {hint && <span className="text-[12px] text-[color:var(--color-muted)]">{hint}</span>}
    </label>
  );
}

// ─── Score ring (relevância) ───────────────────────────────────────────────
export function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const tone = score >= 70 ? 'var(--color-success)' : score >= 40 ? '#A87B1B' : 'var(--color-muted-2)';
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-line)" strokeWidth={2.5} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={tone} strokeWidth={2.5} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tracking-tight" style={{ color: tone }}>{score}</span>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────
export function Avatar({ size = 36, name = 'BoxIA' }: { size?: number; name?: string }) {
  const initials = name.trim().split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)] font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
export function Divider({ children, className = '' }: { children?: ReactNode; className?: string }) {
  if (!children) return <div className={`h-px bg-[color:var(--color-line)] ${className}`} />;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-[color:var(--color-line)]" />
      <span className="text-[12px] text-[color:var(--color-muted-2)] font-medium">{children}</span>
      <div className="flex-1 h-px bg-[color:var(--color-line)]" />
    </div>
  );
}
