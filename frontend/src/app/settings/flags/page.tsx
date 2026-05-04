'use client';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { TaxonomyEditor } from '@/components/TaxonomyEditor';

export default function FlagsSettingsPage() {
  const router = useRouter();
  return (
    <AppShell withTabBar>
      <PageHeader back onBack={() => router.push('/settings')} title="Flags" />
      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll">
        <TaxonomyEditor
          endpoint="/flags"
          singular="flag"
          plural="suas flags"
          hint="Flags são marcações soltas — a IA pode aplicar várias na mesma caixinha (ex.: urgente, sensível, repetida). Use pra destacar o que merece atenção rápida."
        />
      </div>
    </AppShell>
  );
}
