'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button, Card, Badge, Textarea, Divider } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

export default function BrandDnaPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [exampleInput, setExampleInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ active: { contentText: string; examples: string[] } | null }>('/brand-dna')
      .then((r) => {
        if (r.active) { setText(r.active.contentText); setExamples(r.active.examples ?? []); }
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api.put('/brand-dna', {
        contentText: text || 'falo de forma direta e calorosa',
        examples,
      });
      router.push('/home');
    } finally { setSaving(false); }
  }

  function addExample() {
    const t = exampleInput.trim();
    if (!t || examples.length >= 5) return;
    setExamples([...examples, t]); setExampleInput('');
  }

  return (
    <AppShell>
      <PageHeader
        back
        title="Como você fala"
        subtitle="passo 1 de 2"
        trailing={
          <button
            onClick={() => router.push('/home')}
            className="text-[13px] font-medium text-[color:var(--color-muted)] px-3 py-2"
          >
            pular
          </button>
        }
      />

      <div className="flex-1 px-5 pb-3 overflow-y-auto app-scroll flex flex-col gap-4">
        <p className="text-[14px] text-[color:var(--color-muted)] leading-relaxed">
          A BoxIA vai imitar esse jeito quando gerar respostas. Quanto mais detalhe, mais parece você.
        </p>

        <Card padded={false} className="p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-brand-soft)', color: 'var(--color-brand-strong)' }}
          >
            <Icon.Upload width={20} height={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[14px]">Subir um PDF</div>
            <div className="text-[12px] text-[color:var(--color-muted)]">manual de marca em PDF · em breve</div>
          </div>
          <Badge tone="neutral">em breve</Badge>
        </Card>

        <Divider>ou descreva abaixo</Divider>

        <Textarea
          label="Seu jeito de falar"
          hint={`${text.length}/20.000 caracteres`}
          placeholder="Ex.: respondo de forma direta, com humor leve. Uso emojis com moderação. Sempre que possível chamo a pessoa pelo nome..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={20000}
          rows={6}
        />

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[13px] font-medium text-[color:var(--color-ink-2)]">
              Exemplos do seu jeito <span className="text-[color:var(--color-muted-2)] font-normal">(opcional)</span>
            </span>
            <span className="text-[11px] text-[color:var(--color-muted-2)]">{examples.length}/5</span>
          </div>
          <div className="flex flex-col gap-2">
            {examples.map((ex, i) => (
              <Card key={i} padded={false} className="p-3 flex items-start gap-2">
                <div className="flex-1 text-[13px] leading-snug text-[color:var(--color-ink-2)]">"{ex}"</div>
                <button
                  onClick={() => setExamples(examples.filter((_, idx) => idx !== i))}
                  className="text-[color:var(--color-muted-2)] hover:text-[color:var(--color-danger)] -mr-1"
                >
                  <Icon.Close width={16} height={16} />
                </button>
              </Card>
            ))}
            {examples.length < 5 && (
              <div className="flex gap-2">
                <input
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                  placeholder='ex.: "oi gente! tudo bem por aí?"'
                  className="flex-1 h-11 px-3.5 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[14px] placeholder:text-[color:var(--color-muted-2)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 transition-all"
                  maxLength={500}
                />
                <Button size="md" onClick={addExample} disabled={!exampleInput.trim()}>
                  <Icon.Plus width={18} height={18} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)]">
        <Button variant="primary" size="lg" full onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar e continuar'}
          {!saving && <Icon.ArrowRight width={18} height={18} />}
        </Button>
      </div>
    </AppShell>
  );
}
