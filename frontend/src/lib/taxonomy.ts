import { useEffect, useState } from 'react';
import { api, type UserCategory, type UserFlag } from './api';

export type Taxonomy = {
  categories: UserCategory[];
  flags: UserFlag[];
  // Lookup slug → label, cai pro próprio slug se não achar (ex.: categoria deletada).
  categoryLabel: (slug: string | null | undefined) => string;
  flagLabel: (slug: string) => string;
  loaded: boolean;
};

export function useTaxonomy(): Taxonomy {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [flags, setFlags] = useState<UserFlag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<UserCategory[]>('/categories').catch(() => []),
      api.get<UserFlag[]>('/flags').catch(() => []),
    ]).then(([c, f]) => {
      setCategories(c);
      setFlags(f);
      setLoaded(true);
    });
  }, []);

  return {
    categories,
    flags,
    categoryLabel: (slug) => {
      if (!slug) return 'sem categoria';
      return categories.find((c) => c.slug === slug)?.label ?? slug;
    },
    flagLabel: (slug) => flags.find((f) => f.slug === slug)?.label ?? slug,
    loaded,
  };
}
