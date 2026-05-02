'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Input, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

type Pair = { question: string; answer: string };

export default function ImportPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [step, setStep] = useState<'pick' | 'review'>('pick');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extract() {
    if (!files.length) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const r = await api.post<{ extracted: number; pairs: Pair[] }>('/library/import-prints', fd);
      setPairs(r.pairs.length ? r.pairs : files.map((_, i) => ({ question: `pergunta ${i + 1}`, answer: '' })));
      setStep('review');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true);
    try {
      const valid = pairs.filter((p) => p.question.trim() && p.answer.trim());
      await api.post('/library/bulk-save', { pairs: valid });
      router.push('/library');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const filledCount = pairs.filter((p) => p.answer.trim()).length;

  return (
    <AppShell>
      <PageHeader
        title="Subir respostas antigas"
        subtitle={step === 'pick' ? 'prints de caixinhas que você já respondeu' : 'confira antes de salvar'}
        trailing={
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]">
            <Icon.Close />
          </button>
        }
      />

      {step === 'pick' && (
        <>
          <div className="flex-1 px-5 pb-3 flex flex-col gap-3">
            <div
              onClick={() => inputRef.current?.click()}
              className="relative flex-1 min-h-[280px] rounded-[20px] border-2 border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface)] flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-soft)]/40"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
              >
                <Icon.Image width={28} height={28} />
              </div>
              <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight max-w-[280px]">
                Suba prints de caixinhas que você já respondeu
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)] mt-2 leading-relaxed max-w-[300px]">
                A BoxIA lê cada print, separa pergunta e resposta. Você confirma e salva.
              </div>
              {!!files.length && (
                <Badge tone="brand" className="mt-4 h-7 text-[13px]">
                  {files.length} prints escolhidos
                </Badge>
              )}
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 50))}
                className="hidden"
              />
            </div>

            <Card padded={false} className="p-3.5 flex items-start gap-3" style={{ background: 'var(--color-surface-2)' }}>
              <Icon.Sparkle width={16} height={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-brand-strong)' }} />
              <div className="text-[12px] text-[color:var(--color-muted)] leading-relaxed">
                <strong className="text-[color:var(--color-ink-2)]">Dica:</strong> 30 respostas suas já fazem a IA escrever do seu jeito. Quanto mais variadas, melhor.
              </div>
            </Card>

            {error && <div className="text-[13px] text-[color:var(--color-danger)]">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
            <Button variant="primary" size="lg" full onClick={extract} disabled={!files.length || busy}>
              {busy ? 'Lendo prints...' : 'Ler com a BoxIA'}
              {!busy && <Icon.ArrowRight width={18} height={18} />}
            </Button>
          </div>
        </>
      )}

      {step === 'review' && (
        <>
          <div className="px-5 pb-3">
            <div
              className="rounded-[16px] p-3.5 flex items-center gap-3"
              style={{ background: 'var(--color-brand-soft)' }}
            >
              <Icon.Check width={20} height={20} style={{ color: 'var(--color-brand-strong)' }} strokeWidth={2.5} />
              <div className="flex-1">
                <div className="font-semibold text-[14px]" style={{ color: 'var(--color-brand-strong)' }}>
                  {pairs.length} caixinhas encontradas
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-brand-strong)', opacity: 0.7 }}>
                  cole/escreva o que você respondeu — só salvamos as preenchidas
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-3">
            {pairs.map((p, i) => (
              <Card key={i} padded className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">#{i + 1}</Badge>
                  <span className="text-[11px] text-[color:var(--color-muted)]">pergunta</span>
                </div>
                <Input
                  value={p.question}
                  onChange={(e) => setPairs((arr) => arr.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))}
                />
                <Textarea
                  placeholder="cole/escreva o que você respondeu..."
                  value={p.answer}
                  onChange={(e) => setPairs((arr) => arr.map((x, idx) => idx === i ? { ...x, answer: e.target.value } : x))}
                  rows={3}
                />
              </Card>
            ))}
            {error && <div className="text-[13px] text-[color:var(--color-danger)]">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
            <Button variant="primary" size="lg" full onClick={save} disabled={busy || filledCount === 0}>
              {busy ? 'Salvando...' :
               filledCount === 0 ? 'Preencha pelo menos 1 resposta' :
               `Salvar ${filledCount} ${filledCount > 1 ? 'respostas' : 'resposta'}`}
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
