'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api, type Session } from '@/lib/api';

export default function NewSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState<'question' | 'upload'>('question');
  const [promptQuestion, setPromptQuestion] = useState('');
  const [skipQuestion, setSkipQuestion] = useState(false);
  const [mode, setMode] = useState<'video' | 'prints'>('video');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    setFiles(mode === 'video' ? list.slice(0, 1) : list.slice(0, 50));
  }

  async function process() {
    if (!files.length) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('source', mode);
      if (promptQuestion.trim()) fd.append('promptQuestion', promptQuestion.trim());
      files.forEach((f) => fd.append('files', f));
      const session = await api.post<Session>('/sessions', fd);
      router.push(`/sessions/${session.id}/processing`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'question') {
    return (
      <AppShell>
        <PageHeader
          title="Qual foi sua caixinha?"
          subtitle="passo 1 de 2"
          trailing={
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]"
            >
              <Icon.Close />
            </button>
          }
        />

        <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-4">
          <Card padded={false} className="p-4 flex items-start gap-3" style={{ background: 'var(--color-brand-soft)' }}>
            <Icon.Sparkle width={18} height={18} style={{ color: 'var(--color-brand-strong)' }} className="mt-0.5 flex-shrink-0" />
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--color-brand-strong)' }}>
              Quando a BoxIA souber <strong>a pergunta que você fez</strong>, ela entende o contexto e gera respostas muito melhores pra cada seguidor.
            </div>
          </Card>

          <Textarea
            label="O que você perguntou na caixinha?"
            placeholder='ex.: "Qual seu super-herói favorito?" ou "Me indica um livro pra ler"'
            value={promptQuestion}
            onChange={(e) => setPromptQuestion(e.target.value)}
            rows={3}
            maxLength={500}
            hint={`${promptQuestion.length}/500`}
          />

          <button
            onClick={() => { setSkipQuestion(true); setPromptQuestion(''); setStep('upload'); }}
            className="text-[13px] text-[color:var(--color-muted)] underline self-start"
          >
            não lembro / pular essa parte
          </button>
        </div>

        <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => setStep('upload')}
            disabled={!promptQuestion.trim()}
          >
            Continuar <Icon.ArrowRight width={18} height={18} />
          </Button>
        </div>
      </AppShell>
    );
  }

  const accept = mode === 'video' ? 'video/mp4,video/quicktime,video/webm' : 'image/jpeg,image/png,image/heic';
  const totalMb = (files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1);

  return (
    <AppShell>
      <PageHeader
        back
        title="Suba o conteúdo"
        subtitle="passo 2 de 2"
        onBack={() => setStep('question')}
        trailing={
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-[color:var(--color-surface-2)]"
          >
            <Icon.Close />
          </button>
        }
      />

      {(promptQuestion.trim() || skipQuestion) && (
        <div className="px-5 mb-3">
          <Card padded={false} className="p-3 flex items-start gap-2.5" style={{ background: 'var(--color-surface-2)' }}>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)] mt-0.5">caixinha</div>
            <div className="flex-1 text-[13px] leading-snug">
              {promptQuestion.trim() ? `"${promptQuestion}"` : <span className="text-[color:var(--color-muted-2)]">sem contexto definido</span>}
            </div>
            <button
              onClick={() => setStep('question')}
              className="text-[12px] text-[color:var(--color-brand)] font-medium"
            >
              editar
            </button>
          </Card>
        </div>
      )}

      <div className="px-5 mb-4">
        <div className="flex p-1 rounded-[14px] bg-[color:var(--color-surface-2)] gap-1">
          {(['video', 'prints'] as const).map((m) => {
            const active = mode === m;
            const I = m === 'video' ? Icon.Video : Icon.Image;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setFiles([]); }}
                className={`flex-1 h-10 rounded-[10px] flex items-center justify-center gap-1.5 text-[14px] font-medium transition-all ${
                  active
                    ? 'bg-[color:var(--color-surface)] text-[color:var(--color-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    : 'text-[color:var(--color-muted)]'
                }`}
              >
                <I width={16} height={16} />
                {m === 'video' ? 'Vídeo' : 'Prints'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          className="relative flex-1 min-h-[220px] rounded-[20px] border-2 border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface)] flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-soft)]/40"
        >
          {files.length === 0 ? (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
              >
                {mode === 'video' ? <Icon.Video width={26} height={26} /> : <Icon.Image width={26} height={26} />}
              </div>
              <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight">
                Toque pra escolher
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)] mt-1.5 leading-relaxed">
                {mode === 'video'
                  ? 'grave a tela navegando pelas caixinhas · até 15 min'
                  : 'fotos da tela das caixinhas · até 50 imagens'}
              </div>
              <div className="mt-4 px-4 h-9 rounded-full inline-flex items-center text-[13px] font-medium border border-[color:var(--color-line)] bg-[color:var(--color-surface)] gap-1.5">
                <Icon.Upload width={14} height={14} /> abrir galeria
              </div>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
              >
                <Icon.Check width={26} height={26} />
              </div>
              <div className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight">
                {files.length} {mode === 'video' ? 'vídeo escolhido' : `print${files.length > 1 ? 's' : ''} escolhido${files.length > 1 ? 's' : ''}`}
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)] mt-1">{totalMb} MB</div>
              <button
                className="mt-3 text-[12px] text-[color:var(--color-brand)] font-medium underline"
                onClick={(e) => { e.stopPropagation(); setFiles([]); }}
              >trocar</button>
            </>
          )}
          <input ref={inputRef} type="file" accept={accept} multiple={mode === 'prints'} onChange={pick} className="hidden" />
        </div>

        <Card padded={false} className="p-3.5 flex items-start gap-3" style={{ background: 'var(--color-surface-2)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'white', color: 'var(--color-muted)' }}
          >
            <Icon.Lock width={14} height={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium">Seus arquivos ficam só com você</div>
            <div className="text-[12px] text-[color:var(--color-muted)] mt-0.5 leading-relaxed">
              apagamos automaticamente em 7 dias
            </div>
          </div>
        </Card>

        {error && (
          <Card padded={false} className="p-3 border-[color:var(--color-danger)]/30">
            <div className="text-[13px] text-[color:var(--color-danger)]">{error}</div>
          </Card>
        )}
      </div>

      <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
        <Button variant="primary" size="lg" full onClick={process} disabled={!files.length || busy}>
          {busy ? 'Enviando...' : 'Ler com a BoxIA'}
          {!busy && <Icon.ArrowRight width={18} height={18} />}
        </Button>
        <div className="text-[11px] text-center text-[color:var(--color-muted-2)] mt-2">
          leva uns 2 minutinhos
        </div>
      </div>
    </AppShell>
  );
}
