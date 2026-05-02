'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, BoxLogo } from '@/components/AppShell';
import { Button, Input, Divider } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

export default function WelcomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'login' | 'register'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const data = await api.post<{ token: string }>(path, { email, password });
      api.setToken(data.token);
      router.push(mode === 'register' ? '/onboarding/dna' : '/home');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
        <div className="flex items-center gap-2 mb-8">
          <BoxLogo size={20} />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="relative mb-8">
            <div
              className="absolute -top-4 -left-4 w-32 h-32 rounded-full opacity-60 blur-3xl"
              style={{ background: 'var(--color-brand-soft)' }}
            />
            <div className="relative">
              <h1 className="font-[family-name:var(--font-display)] text-[40px] leading-[1.05] font-bold tracking-tight">
                Responda suas<br />
                caixinhas <span style={{ color: 'var(--color-brand)' }}>do seu jeito</span>.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-muted)]">
                Grava as caixinhas no celular, sobe no BoxIA. A gente lê, organiza por importância e gera respostas que parecem suas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-10">
            {[
              { icon: Icon.Video,   label: 'Vídeo ou prints' },
              { icon: Icon.Sparkle, label: 'Soa como você' },
              { icon: Icon.Bolt,    label: 'Aprende com o uso' },
            ].map((f, i) => {
              const I = f.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
                  >
                    <I width={18} height={18} />
                  </div>
                  <span className="text-[11px] text-[color:var(--color-muted)] leading-tight">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {mode === 'idle' ? (
          <div className="flex flex-col gap-2.5">
            <Button variant="primary" size="lg" full onClick={() => setMode('register')}>
              Criar conta grátis
            </Button>
            <Button variant="ghost" size="lg" full onClick={() => setMode('login')}>
              Já tenho conta
            </Button>
            <p className="text-[11px] text-center text-[color:var(--color-muted-2)] mt-2">
              ao continuar, você aceita nossos termos e a política de privacidade
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('idle')}
              className="text-[12px] text-[color:var(--color-muted)] flex items-center gap-1 -mt-2 self-start"
            >
              <Icon.ArrowLeft width={14} height={14} /> voltar
            </button>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder={mode === 'register' ? 'crie uma senha (mín 6)' : 'sua senha'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              error={error ?? undefined}
            />
            <Button variant="primary" size="lg" full onClick={submit} disabled={loading}>
              {loading ? '...' : (mode === 'register' ? 'Criar conta' : 'Entrar')}
            </Button>
            <Divider>ou</Divider>
            <Button variant="secondary" size="lg" full onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
              {mode === 'register' ? 'Já tenho conta' : 'Criar conta nova'}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
