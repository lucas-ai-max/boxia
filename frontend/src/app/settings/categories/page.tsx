'use client';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { TaxonomyEditor } from '@/components/TaxonomyEditor';

export default function CategoriesSettingsPage() {
  const router = useRouter();
  return (
    <AppShell withTabBar>
      <PageHeader back onBack={() => router.push('/settings')} title="Categorias" />
      <div className="flex-1 px-5 pb-5 overflow-y-auto app-scroll">
        <TaxonomyEditor
          endpoint="/categories"
          singular="categoria"
          plural="suas categorias"
          hint="A IA usa essas categorias pra classificar cada caixinha. Defina os tipos de pergunta que você costuma receber — quanto mais específico, melhor."
        />
      </div>
    </AppShell>
  );
}
