'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { Icon } from '@/components/icons';
import { api } from '@/lib/api';

export type TaxonomyItem = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  createdAt: string;
};

type Props = {
  endpoint: '/categories' | '/flags';
  // Singular pra microcopy ("nova categoria", "nova flag").
  singular: string;
  // Plural pra microcopy ("suas categorias", "suas flags").
  plural: string;
  // Texto curto da microcopy do empty state e do hint da descrição.
  hint: string;
};

export function TaxonomyEditor({ endpoint, singular, plural, hint }: Props) {
  const [items, setItems] = useState<TaxonomyItem[] | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.get<TaxonomyItem[]>(endpoint).then(setItems).catch((e) => setError((e as Error).message));
  }, [endpoint]);

  async function addItem() {
    const label = draft.trim();
    if (!label) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.post<TaxonomyItem>(endpoint, { label });
      setItems((prev) => [...(prev ?? []), created]);
      setDraft('');
      // Abre direto pra edição da descrição — sinaliza pro user que ele deve
      // descrever o que conta como esse item (a IA usa a descrição pra classificar).
      setEditingId(created.id);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (e) {
      setError((e as Error).message || 'erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function patchItem(id: string, patch: { label?: string; description?: string | null }) {
    const updated = await api.patch<TaxonomyItem>(`${endpoint}/${id}`, patch);
    setItems((prev) => prev?.map((i) => (i.id === id ? updated : i)) ?? null);
  }

  async function removeItem(id: string) {
    if (!confirm(`Apagar essa ${singular}?`)) return;
    await api.del(`${endpoint}/${id}`);
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <Card padded className="flex flex-col gap-2.5">
        <div className="text-[13px] text-[color:var(--color-muted)] leading-snug">{hint}</div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder={`nova ${singular}…`}
            className="flex-1 h-11 px-3.5 rounded-[12px] bg-[color:var(--color-surface)] border border-[color:var(--color-line)] text-[14px] placeholder:text-[color:var(--color-muted-2)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/15 transition-all"
            disabled={saving}
          />
          <Button variant="primary" size="md" onClick={addItem} disabled={!draft.trim() || saving}>
            <Icon.Plus width={16} height={16} /> add
          </Button>
        </div>
        {error && <div className="text-[12px] text-[color:var(--color-danger)]">{error}</div>}
      </Card>

      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)] mb-2 px-1">
          {plural} ({items?.length ?? 0})
        </h3>
        {items === null ? (
          <Card padded className="text-center text-[13px] text-[color:var(--color-muted)]">carregando…</Card>
        ) : items.length === 0 ? (
          <Card padded className="text-center text-[13px] text-[color:var(--color-muted)]">
            nenhuma {singular} ainda — digite acima e pressione Enter
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <TaxonomyRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                onToggle={() => setEditingId(editingId === item.id ? null : item.id)}
                onPatch={(p) => patchItem(item.id, p)}
                onDelete={() => removeItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaxonomyRow({
  item, editing, onToggle, onPatch, onDelete,
}: {
  item: TaxonomyItem;
  editing: boolean;
  onToggle: () => void;
  onPatch: (p: { label?: string; description?: string | null }) => Promise<void>;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(item.label);
  const [description, setDescription] = useState(item.description ?? '');
  const [saving, setSaving] = useState(false);

  // Re-sincroniza form se a row foi atualizada externamente.
  useEffect(() => {
    setLabel(item.label);
    setDescription(item.description ?? '');
  }, [item.label, item.description]);

  async function save() {
    setSaving(true);
    try {
      const next: { label?: string; description?: string | null } = {};
      if (label.trim() !== item.label) next.label = label.trim();
      if ((description.trim() || null) !== item.description) next.description = description.trim() || null;
      if (Object.keys(next).length > 0) await onPatch(next);
      onToggle();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-[color:var(--color-surface-2)] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[14px] truncate">{item.label}</div>
          <div className="text-[12px] text-[color:var(--color-muted)] mt-0.5 truncate">
            {item.description || <span className="italic">sem descrição — a IA classifica melhor com uma</span>}
          </div>
        </div>
        <Icon.ChevronDown
          width={16}
          height={16}
          className={`text-[color:var(--color-muted-2)] transition-transform ${editing ? 'rotate-180' : ''}`}
        />
      </button>

      {editing && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-[color:var(--color-line)]/60">
          <Input
            label="nome"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="nome curto"
          />
          <Textarea
            label="descrição (orienta a IA)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex.: perguntas sobre preço, especificações ou disponibilidade dos produtos"
            hint="quanto mais clara, melhor a IA classifica"
            rows={3}
          />
          <div className="flex gap-2 justify-between items-center">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-[10px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] transition-colors"
            >
              <Icon.Trash width={14} height={14} /> apagar
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onToggle}>cancelar</Button>
              <Button variant="primary" size="sm" onClick={save} disabled={saving || !label.trim()}>
                {saving ? 'salvando…' : 'salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
