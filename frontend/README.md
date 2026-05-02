# BoxIA — Frontend

PWA Next.js 15 (App Router) + Tailwind 4 com estilo "low-fi sketchy" do wireframe.

## Setup

```bash
cp .env.local.example .env.local
# garanta que NEXT_PUBLIC_API_URL aponta para o backend
npm install
npm run dev
```

Abra `http://localhost:3000`. No celular (mesma rede), use `http://<IP-do-pc>:3000` para experimentar como PWA.

## Rotas (10 telas do wireframe)

| Rota | Tela | Wireframe |
|---|---|---|
| `/` | Welcome / login | S1 |
| `/onboarding/dna` | DNA da marca | S2 |
| `/home` | Histórico de sessões | S3 |
| `/sessions/new` | Nova sessão (vídeo/prints) | S4 |
| `/sessions/[id]/processing` | Processando (SSE) | S5 |
| `/sessions/[id]` | Lista classificada | S6 |
| `/sessions/[id]/caixinhas/[cid]` | Detalhe + 2-3 sugestões | S7 |
| `/library` | Biblioteca RAG | S8 |
| `/library/import` | Importar prints históricos | S9 |
| `/metrics` | Métricas pessoais | S10 |
| `/settings` | Ajustes / logout | extra |

## PWA

- `public/manifest.webmanifest` — metadata
- `public/sw.js` — service worker (cache-first p/ assets, network-first p/ HTML)
- Registrado em `src/app/layout.tsx`

## Componentes-chave

- `PhoneShell` — frame mobile responsivo (bordas no desktop, full-bleed no mobile) com tab bar opcional
- `Sketchy` — primitivos `Box`, `Pill`, `Btn`, `ScoreDot`, `Squiggle`, `Avatar` no estilo do wireframe
- `lib/api.ts` — cliente HTTP + tipos compartilhados com o backend

## Cores (variáveis CSS)

```css
--color-accent: #FF6B4A;
--color-accent-soft: #FFE4DB;
--color-ink: #1a1a1a;
--color-paper: #FAFAF7;
--color-sketch: #2a2a2a;
```

Fontes via Google Fonts: Architects Daughter, Caveat, Kalam.
