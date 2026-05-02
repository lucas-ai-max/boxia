# PRD — BoxIA

> **Product Requirements Document** — versão 1.0 (incremental/dinâmico)
> **Produto**: BoxIA — PWA mobile-first para ler, classificar e responder caixinhas do Instagram com IA personalizada.
> **Status**: PRD inicial. Documento vivo — será revisado a cada ciclo (UX → Arquitetura → PO → Histórias → Dev), conforme metodologia ensinada em [Arquivos base/transcripton_aula](Arquivos base/transcripton_aula).

---

## Sumário

1. [Briefing](#1-briefing)
2. [Visão do Produto](#2-visão-do-produto)
3. [Personas e Jobs-to-be-Done](#3-personas-e-jobs-to-be-done)
4. [Requisitos Funcionais](#4-requisitos-funcionais)
5. [Requisitos Não-Funcionais](#5-requisitos-não-funcionais)
6. [Especificações de UX](#6-especificações-de-ux)
7. [Arquitetura Técnica](#7-arquitetura-técnica)
8. [Backlog de Histórias de Usuário](#8-backlog-de-histórias-de-usuário)
9. [Métricas de Sucesso](#9-métricas-de-sucesso)
10. [Restrições e Riscos](#10-restrições-e-riscos)
11. [Próximos Passos](#11-próximos-passos)

---

## 1. Briefing

### 1.1 Problema central

Criadores de conteúdo, infoprodutores e marcas pessoais com volume médio/alto no Instagram recebem **dezenas a centenas de caixinhas (Q&A stickers)** por semana. Hoje:

- **Volume sufoca**: responder uma a uma consome 1-3h/semana.
- **Tom inconsistente**: respostas escritas com pressa fogem do "tom de voz" da marca.
- **Oportunidades perdidas**: caixinhas valiosas (potenciais leads, ideias de conteúdo) se misturam com ruído (elogios genéricos, perguntas repetidas).
- **IA genérica não resolve**: ferramentas tipo ChatGPT geram respostas "plásticas", sem o DNA da pessoa, exigindo edição manual que anula o ganho.

### 1.2 Público-alvo

- **Primário**: criadores e marcas pessoais com 10k–500k seguidores no Instagram, que usam caixinhas como ferramenta regular de engajamento.
- **Secundário**: infoprodutores, coaches, profissionais liberais (médicos, advogados, nutricionistas) que respondem dúvidas de seguidores.
- **Terciário (futuro)**: equipes de social media gerenciando contas de terceiros.

### 1.3 Hipóteses de valor

1. **H1 — Autenticidade via histórico**: alimentar a IA com perguntas e respostas reais já dadas pelo usuário (RAG) gera respostas indistinguíveis do tom autêntico em <30 exemplos.
2. **H2 — Triagem por relevância** reduz tempo de resposta em >70% ao priorizar caixinhas de alto valor.
3. **H3 — Loop de aprendizado** (curtir/editar/usar) faz a qualidade percebida crescer mês a mês sem intervenção manual.
4. **H4 — Mobile-first + PWA** é suficiente: usuário grava no celular, processa no celular, responde no celular. Não precisa de app nativo.

### 1.4 Concorrentes e alternativas

| Alternativa | Limitação |
|---|---|
| Responder manualmente | Não escala; cansa; tom inconsistente sob pressão |
| ChatGPT/Claude genérico | Sem DNA da marca; precisa copiar/colar; sem classificação |
| Manychat / DM auto-responders | Foco em DM, não em caixinhas; respostas pré-prontas, não contextuais |
| Agências de social media | Caro; perde-se autenticidade |

**Diferencial do BoxIA**: única ferramenta que (a) lê vídeo/print de caixinhas via Gemini 3, (b) responde no tom autêntico via RAG histórico do próprio usuário, (c) aprende continuamente.

---

## 2. Visão do Produto

### 2.1 Objetivo

> Permitir que qualquer criador de conteúdo transforme uma gravação de tela ou prints das suas caixinhas em uma fila priorizada de respostas prontas, no seu próprio tom de voz, em menos de 5 minutos — e que essa qualidade aumente automaticamente com o uso.

### 2.2 Proposta de valor

**"Você grava. O BoxIA lê, classifica e escreve no seu tom. Você só copia e cola."**

Pilares:

1. **Leitura inteligente**: Gemini 3 extrai todas as caixinhas de um vídeo ou batch de prints com altíssima precisão.
2. **Classificação por relevância**: cada caixinha recebe score + categoria, ordenadas para você responder primeiro o que importa.
3. **Resposta autêntica via RAG**: combina **DNA da marca** (PDF/texto) + **biblioteca histórica de Q&A real do usuário** + **feedback recente** para gerar 2-3 sugestões.
4. **Aprendizado contínuo**: cada resposta aprovada vira novo exemplo no RAG. O produto fica melhor a cada uso.
5. **Transparência total**: a UI sempre informa **"X caixinhas identificadas"** e mostra quais exemplos do histórico inspiraram cada sugestão.

### 2.3 Princípios de design

- **Mobile-first absoluto**: todas as telas projetadas para uma mão, polegar direito.
- **Baixíssima fricção**: do upload à resposta copiada em ≤3 toques.
- **Voz da marca preservada**: nunca substituir o usuário, apenas amplificar seu tom.
- **Transparência da IA**: usuário sempre sabe quantas caixinhas foram lidas e por quê uma resposta foi gerada daquele jeito.
- **Privacidade por padrão**: vídeos descartados após processamento; dados isolados por tenant.

---

## 3. Personas e Jobs-to-be-Done

### 3.1 Persona principal — Camila, criadora de conteúdo

- 28 anos, 87k seguidores no IG, nicho de bem-estar.
- Usa caixinhas 2-3x por semana para engajar e gerar ideias de conteúdo.
- Recebe 80-150 respostas por caixinha. Hoje gasta 2h respondendo.
- Já tentou ChatGPT mas as respostas "não soavam como ela".

### 3.2 Persona secundária — Dr. Rafael, médico/influencer

- 41 anos, 45k seguidores, dermatologista.
- Caixinhas semanais com dúvidas médicas.
- Precisa de tom técnico-acessível consistente; não pode soar "robótico".

### 3.3 Jobs-to-be-Done

| Quando... | Quero... | Para... |
|---|---|---|
| Recebo uma enxurrada de caixinhas | Saber rapidamente quais valem responder | Não perder tempo com ruído |
| Vou responder uma caixinha | Ter sugestões no meu tom já prontas | Apenas revisar e copiar, não escrever do zero |
| Já respondi várias caixinhas no passado | Que a IA aprenda meu jeito | Não ter que editar toda resposta gerada |
| Avalio uma sugestão da IA | Curtir, editar ou descartar com 1 toque | Treinar a IA sem esforço extra |

---

## 4. Requisitos Funcionais

> 8 features-núcleo. Cada uma tem requisitos mensuráveis e critérios de aceite.

### 4.1 Onboarding e DNA da Marca

**Objetivo**: capturar identidade da marca para guiar geração de respostas.

**Requisitos**:

- **RF-1.1** Cadastro com email/senha + login social Google.
- **RF-1.2** Upload de DNA da marca em dois formatos:
  - PDF (até 10MB) — parser extrai texto bruto.
  - Textarea livre (até 20.000 caracteres).
- **RF-1.3** Editor pós-upload: usuário pode revisar/editar o texto extraído antes de salvar.
- **RF-1.4** Versionamento simples: cada save gera nova versão; usuário pode rollback para versão anterior.
- **RF-1.5** Bloco opcional "Exemplos de tom": 3-5 textos curtos (até 500 caracteres cada) representando respostas autênticas do usuário.
- **RF-1.6** Status de "Marca configurada" visível na home; sem isso, geração de resposta usa apenas modelo base com aviso.

**Critérios de aceite**:
- Usuário completa onboarding em ≤3 minutos.
- DNA salvo é versionado e recuperável.

---

### 4.2 Base Histórica de Caixinhas (RAG de Q&A) — NÚCLEO DA AUTENTICIDADE

**Objetivo**: alimentar uma biblioteca privada de pares Pergunta+Resposta reais já dados pelo usuário, usada como base de tom autêntico via RAG (Retrieval-Augmented Generation).

> **Por que isso é crítico**: o DNA da marca descreve *como o usuário diz que escreve*. O RAG histórico mostra *como ele realmente escreve*. A diferença muda a qualidade percebida da geração.

**Requisitos**:

- **RF-2.1** Três formas de inserir caixinhas históricas:
  - **(a) Prints/screenshots**: upload de 1 a N imagens (jpg/png, até 10MB cada). Sistema usa Gemini 3 visão multimodal para extrair pergunta + resposta visíveis na imagem (ex: print da caixinha já respondida no IG).
  - **(b) Vídeo histórico**: mesma pipeline da seção 4.3, mas com flag `historical=true`. Após extração das perguntas, usuário cola/escreve a resposta que ele deu para cada uma.
  - **(c) Entrada manual**: formulário simples com dois campos (pergunta, resposta) para casos rápidos.
- **RF-2.2** Cada par Q&A salvo gera embedding vetorial (pgvector) com metadados:
  - `created_at`, `source` (print|video|manual), `category` (auto-classificada), `length_class` (curta|média|longa), `tone_tags` (auto: humor, técnico, acolhedor, direto…).
- **RF-2.3** UI dedicada **"Minha biblioteca de respostas"**:
  - Lista paginada com busca textual e por filtros (categoria, fonte, data).
  - Ações por item: editar, duplicar, remover.
  - Indicador de "saúde da biblioteca": cor verde a partir de ≥30 pares.
- **RF-2.4** **RAG na geração** (acoplamento com 4.6):
  - Para cada caixinha nova a responder, buscar top-`k` (default `k=5`) pares Q&A semanticamente similares (cosine similarity).
  - Injetar como exemplos few-shot no prompt do Gemini.
- **RF-2.5** **Sempre que processar prints/vídeo no fluxo histórico, exibir**: `"✅ X caixinhas identificadas — adicione/edite as respostas para salvá-las na sua biblioteca."`
- **RF-2.6** Importação em lote: ZIP de prints aceito (até 50 arquivos por upload).

**Critérios de aceite**:
- Usuário consegue chegar a 30+ pares em ≤30min via prints batch.
- Geração com RAG usando ≥5 exemplos é detectavelmente mais "no tom" do que sem RAG (medido por taxa de aprovação na seção 4.7).

---

### 4.3 Ingestão de Conteúdo Novo (Vídeo OU Prints)

**Objetivo**: receber o conteúdo a ser respondido em qualquer formato prático.

**Requisitos**:

- **RF-3.1** Tela única "Nova sessão de caixinhas" com toggle: `Vídeo` | `Prints`.
- **RF-3.2** **Modo Vídeo**:
  - Aceitar mp4/mov/webm.
  - Tamanho máx: 500MB. Duração máx: 15 min.
  - Drag-drop em desktop; tap-to-pick em mobile (abre galeria nativa).
- **RF-3.3** **Modo Prints**:
  - Aceitar jpg/png/heic.
  - Múltiplos arquivos por upload (até 50).
  - Preview em grid antes de processar.
- **RF-3.4** Upload com progresso visual e retomada automática em queda de conexão (resumable uploads via tus.io ou equivalente).
- **RF-3.5** Armazenamento temporário em object storage com **TTL configurável** (default: 7 dias) e botão "deletar agora".
- **RF-3.6** **Após extração, UI exibe SEMPRE em destaque**:
  > `✅ X caixinhas identificadas neste [vídeo de 4m23s | conjunto de 12 prints]`
  Esse contador é auditável (usuário pode ver a lista) e é campo obrigatório no retorno do backend.

**Critérios de aceite**:
- Upload de 100MB em 4G conclui com retomada após queda de rede.
- Contador de caixinhas é exibido em <2s após o término do processamento.

---

### 4.4 Processamento com Gemini 3

**Objetivo**: extrair caixinhas estruturadas de qualquer entrada, com pipeline normalizada.

**Requisitos**:

- **RF-4.1** Pipelines paralelas:
  - **Vídeo** → Gemini 3 (vídeo nativo) → JSON estruturado.
  - **Prints** → Gemini 3 (visão multimodal, batch) → JSON estruturado.
- **RF-4.2** **Schema de saída unificado**:
  ```json
  {
    "session_id": "uuid",
    "source": "video" | "prints",
    "total_caixinhas": 17,
    "caixinhas": [
      {
        "id": "uuid",
        "pergunta": "string",
        "contexto_visual": "string opcional (ex: emojis, sticker, autor anonimizado)",
        "timestamp_seg": 42 | null,
        "indice_print": 3 | null,
        "confidence": 0.92
      }
    ]
  }
  ```
- **RF-4.3** Campo `total_caixinhas` é **obrigatório** e usado pela UI para o contador de transparência (RF-3.6).
- **RF-4.4** Status em tempo real via WebSocket ou SSE: `queued` → `processing` → `ready` | `failed`.
- **RF-4.5** Retry automático em falhas transitórias (até 3 tentativas com backoff exponencial).
- **RF-4.6** Custo estimado de processamento exibido ANTES (estimativa por minuto/imagem) e DEPOIS (custo real) na UI.
- **RF-4.7** Anonimização: nomes/handles de quem mandou a caixinha são removidos do payload (privacidade dos seguidores).
- **RF-4.8** Abstração via interface `LLMVideoProvider` para permitir troca de fornecedor (Gemini → outro) sem refatorar o resto.

**Critérios de aceite**:
- Vídeo de 5min extrai com ≥95% de recall em caixinhas visualmente claras.
- Falha transitória nunca exige re-upload pelo usuário.

---

### 4.5 Classificação de Relevância

**Objetivo**: ordenar caixinhas para que o usuário responda primeiro o que vale.

**Requisitos**:

- **RF-5.1** Cada caixinha recebe:
  - **Score** (0-100) — relevância geral.
  - **Categoria** (enum): `dúvida-produto`, `pedido-conteúdo`, `elogio`, `feedback-construtivo`, `oportunidade-lead`, `pergunta-pessoal`, `ruído`, `sensível`.
  - **Sinalizações** (booleans): `urgente`, `requer-atenção-humana`, `repetida`.
- **RF-5.2** Critérios de score (peso configurável, defaults):
  - Alinhamento com DNA da marca (30%).
  - Potencial de engajamento / virada de conteúdo (25%).
  - Especificidade da pergunta (20%).
  - Não-redundância vs caixinhas já respondidas no histórico (15%).
  - Sensibilidade negativa (-10%, caixinhas tóxicas penalizadas).
- **RF-5.3** Lista renderizada já ordenada por score desc; usuário pode reordenar por categoria ou data.
- **RF-5.4** Modelo inicial: prompt estruturado no Gemini com few-shot dos exemplos de tom (RF-1.5) e amostragem do RAG histórico.
- **RF-5.5** Caixinhas com `categoria=ruído` ou `score<20` colapsadas por padrão (visíveis com 1 toque).

**Critérios de aceite**:
- Top-10 caixinhas por score correspondem ao que o usuário responderia manualmente em ≥70% dos casos (validação por usuários beta).

---

### 4.6 Geração de Resposta (DNA + RAG histórico + Feedback)

**Objetivo**: produzir 2-3 respostas no tom autêntico do usuário, prontas para copiar.

**Requisitos**:

- **RF-6.1** Para cada caixinha selecionada, gerar **2 a 3 sugestões** de resposta.
- **RF-6.2** **Composição do prompt** (ordem importa):
  1. **Sistema**: persona + DNA da marca (RF-1.2) + exemplos de tom (RF-1.5).
  2. **Few-shot dinâmico**: top-k pares Q&A do RAG histórico (RF-2.4) — fonte primária de autenticidade.
  3. **Reforço recente**: top-N respostas curtidas/usadas nos últimos 30 dias (RF-7.2).
  4. **Input**: caixinha atual + sua categoria + sinalizações.
- **RF-6.3** **Indicador de transparência na UI**: cada sugestão mostra link "Inspirado em" expondo os 2-3 exemplos do RAG que mais influenciaram a geração.
- **RF-6.4** Botão **Copiar** (copy-to-clipboard) com haptic feedback no mobile.
- **RF-6.5** Botão **Regenerar** com instruções rápidas pré-selecionáveis: `mais curta`, `mais informal`, `mais técnica`, `com humor`, `+ emoji`, `- emoji`. E campo livre para instrução custom.
- **RF-6.6** Resposta gerada em streaming (TTFT <1s) para sensação de fluidez.
- **RF-6.7** Limite de tamanho configurável (default: 280 caracteres) por ser tamanho ideal de resposta de caixinha.

**Critérios de aceite**:
- ≥60% das respostas são copiadas sem edição após o usuário ter ≥30 pares no RAG histórico.
- TTFT (time-to-first-token) ≤1s p95.

---

### 4.7 Loop de Aprendizado (ML feedback)

**Objetivo**: cada interação do usuário melhora a qualidade futura, automaticamente.

**Requisitos**:

- **RF-7.1** Em cada sugestão gerada, 4 ações com 1 toque:
  - 👍 **Curtir** — sinaliza qualidade alta.
  - ✏️ **Editar** — abre textarea; texto editado é capturado.
  - 🗑️ **Descartar** — sinaliza inadequação.
  - 📋 **Usei essa** — botão de cópia também registra uso.
- **RF-7.2** Capturar a **versão final efetivamente usada** (cópia ou edição). Esse texto é o sinal mais valioso.
- **RF-7.3** **Fechamento automático do ciclo**: toda resposta com `usei=true` ou `editou_e_copiou=true` é **automaticamente adicionada ao RAG histórico** (4.2) com flag `auto_imported=true`.
- **RF-7.4** Base de feedback isolada por tenant; nunca cruzada entre usuários.
- **RF-7.5** **Estratégia evolutiva em 3 versões**:

  | Versão | Quando | O que muda |
  |---|---|---|
  | **V1 — Lançamento** | MVP | RAG dinâmico: top-k vizinhos + top-N recentes aprovados entram no prompt few-shot. |
  | **V2 — Após ~500 feedbacks/usuário** | Pós-validação | Re-ranking dos exemplos do RAG por taxa de aprovação histórica × similaridade × recência. Filtro anti-drift (se uma resposta começa a ser editada com frequência, ela é despromovida). |
  | **V3 — Escala** | Pós-product/market fit | LLM-as-judge: avaliação automatizada A/B entre versões da geração. Fine-tuning opcional por tenant para usuários power. |

**Critérios de aceite**:
- Taxa de "Usei essa" sobe de 40% (V1 dia 1) para >65% (V1 dia 60) sem mudança de modelo, apenas pelo crescimento do RAG.
- Feedback negativo (descarte) reduz peso do exemplo correspondente em geração futura em ≤24h.

---

### 4.8 Histórico e Dashboard

**Objetivo**: dar ao usuário visibilidade do uso e da evolução da qualidade.

**Requisitos**:

- **RF-8.1** Lista de **sessões de processamento** passadas com:
  - Data, fonte (vídeo/prints), **contagem de caixinhas identificadas**, % de respostas usadas.
- **RF-8.2** Tela de **métricas pessoais**:
  - Total de caixinhas processadas.
  - Tamanho da biblioteca RAG.
  - % de respostas curtidas/usadas (gráfico de evolução semanal).
  - Indicador de "evolução do tom" (medida de consistência: quão similares estão as respostas usadas em comparação a 30 dias atrás).
- **RF-8.3** Filtros e busca textual em todas as caixinhas históricas processadas.
- **RF-8.4** Export: usuário pode baixar (CSV/JSON) sua biblioteca RAG e seu histórico (LGPD/portabilidade).

**Critérios de aceite**:
- Dashboard carrega em <1s para usuários com até 10k caixinhas processadas.
- Export é gerado em <30s.

---

## 5. Requisitos Não-Funcionais

| Categoria | Requisito | Alvo |
|---|---|---|
| **Performance** | Vídeo de 5min processado | <3min p95 |
| **Performance** | TTFT em geração de resposta | <1s p95 |
| **Performance** | Carregamento inicial PWA | LCP <2.5s em 4G |
| **Privacidade** | TTL de vídeos | Default 7 dias, configurável |
| **Privacidade** | Anonimização de autores das caixinhas | Sempre |
| **Privacidade** | Isolamento por tenant | Row-level security no Postgres |
| **Conformidade** | LGPD: portabilidade, exclusão, consentimento | Implementado no MVP |
| **Disponibilidade** | Uptime do app | 99% no MVP, 99.5% pós-PMF |
| **Mobile-first** | Plataformas suportadas | iOS Safari 16+, Android Chrome 110+ |
| **PWA** | Instalável + ícone home screen | Sim |
| **PWA** | Offline | Visualização de histórico e biblioteca; geração exige rede |
| **Acessibilidade** | WCAG 2.1 AA | Mínimo no MVP |
| **i18n** | Idioma | PT-BR no MVP; EN-US e ES-LATAM em V2 |
| **Custo** | Cap por usuário/mês (default) | Configurável; default = 60 minutos de vídeo + 200 prints |

---

## 6. Especificações de UX

### 6.1 Fluxos principais

```
┌─────────────┐
│  Onboarding │  → cadastro → DNA → primeiro print/vídeo histórico (opcional)
└──────┬──────┘
       │
┌──────▼──────┐    ┌──────────────────┐    ┌─────────────────┐
│   Home      │───▶│  Nova sessão     │───▶│  Processando…   │
│ (histórico) │    │ (vídeo ou prints)│    │ (status visual) │
└──────┬──────┘    └──────────────────┘    └────────┬────────┘
       │                                            │
       │           ┌───────────────────────────────┐│
       │           │ "✅ 17 caixinhas identificadas"│◀
       │           └────────────┬──────────────────┘
       │                        │
       │           ┌────────────▼──────────────┐
       │           │  Lista classificada       │
       │           │  (score + categoria)      │
       │           └────────────┬──────────────┘
       │                        │
       │           ┌────────────▼──────────────┐
       │           │  Detalhe + 2-3 sugestões  │──👍/✏️/🗑️/📋──┐
       │           └───────────────────────────┘                │
       │                                                        │
       │                                                        ▼
       │                                          ┌──────────────────────┐
       └─────────────────────────────────────────▶│  RAG atualizado      │
                                                  │  (auto-import)       │
                                                  └──────────────────────┘
```

### 6.2 Telas centrais (wireframe textual)

**T1 — Home / Histórico**
- Header: avatar + saúde da biblioteca RAG (badge: 🟢 47 pares).
- CTA primário sticky bottom: `+ Nova sessão`.
- Lista de sessões anteriores (cards com data, contagem, % usadas).

**T2 — Nova Sessão**
- Toggle topo: `Vídeo` | `Prints`.
- Área de upload grande, mobile-friendly.
- Aviso de privacidade discreto.

**T3 — Processando**
- Progress visual + tempo estimado + custo estimado.
- Cancelar visível.

**T4 — Resultado / Lista classificada**
- **Banner de transparência**: `✅ 17 caixinhas identificadas neste vídeo de 4m23s` — sempre presente.
- Filtros: `Todas` | `Por categoria` | `Só urgentes`.
- Cards com pergunta truncada, score (cor), categoria, sinalizações.
- Tap no card abre T5.

**T5 — Detalhe + Resposta (bottom sheet)**
- Pergunta completa + contexto.
- 2-3 sugestões em swipeable cards.
- Para cada: ações 👍 ✏️ 🗑️ 📋.
- Link "Inspirado em" expande exemplos do RAG usados.
- Botão "Regenerar" com chips de modificação.

**T6 — Minha Biblioteca**
- Busca + filtros.
- Lista de pares Q&A.
- FAB `+ Adicionar` (manual / print / vídeo histórico).

### 6.3 Padrões mobile

- **Bottom sheets** em vez de modais (one-thumb friendly).
- **Swipe actions**: deslizar para curtir/descartar.
- **Haptic feedback** em copiar e nas ações de feedback.
- **Sticky bottom CTAs** sempre acessíveis ao polegar.
- **Tipografia**: 16px mínimo no corpo; targets de toque ≥44×44px.

---

## 7. Arquitetura Técnica

### 7.1 Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + React 19 + Tailwind | PWA nativo no Next, server components reduzem bundle, ecossistema maduro |
| **PWA** | `next-pwa` ou Workbox direto + service worker custom | Offline para histórico; instalável |
| **Estilo** | Tailwind + shadcn/ui (mobile-first overrides) | Velocidade + acessibilidade out-of-box |
| **Auth** | Clerk **ou** Supabase Auth | Gerenciado, suporta Google + email, RLS-ready |
| **Backend** | Next.js API routes + Edge Functions onde possível | Co-localizado, deploy simples |
| **Fila de jobs** | Inngest **ou** BullMQ + Redis | Vídeo é longo, precisa fila com retry/observabilidade |
| **DB relacional** | Postgres (Supabase ou Neon) | Maduro, com pgvector |
| **Vector DB** | pgvector na mesma instância Postgres | Evita 2º banco; escala bem até milhões de vetores |
| **Object storage** | Cloudflare R2 **ou** AWS S3 | TTL nativo, custo previsível |
| **Embeddings** | `text-embedding-3-large` (OpenAI) ou Gemini Embeddings | Qualidade + custo |
| **LLM (extração + classificação + geração)** | **Gemini 3** via Google AI SDK (Node) | Vídeo nativo é diferencial chave do produto |
| **Streaming** | SSE (server-sent events) | Geração token a token; mais simples que WebSocket |
| **Observabilidade** | Sentry (erros) + OpenTelemetry → Grafana/Honeycomb | Tracing das chamadas Gemini é crítico para custo |
| **Logging estruturado** | Pino (Node) | JSON, performance |
| **Pagamentos (V2)** | Stripe | Padrão SaaS |

### 7.2 Modelo de dados (resumido)

```
users(id, email, created_at)
brand_dna(id, user_id, version, content_text, created_at)
brand_examples(id, user_id, text, created_at)

historical_qa(
  id, user_id, question, answer,
  source: enum('print','video','manual','auto_import'),
  category, tone_tags[], length_class,
  embedding: vector(1536),
  created_at
)

sessions(id, user_id, source: enum('video','prints'),
  storage_url, total_caixinhas, status, cost_cents, created_at, deleted_at)

caixinhas(id, session_id, pergunta, contexto_visual,
  timestamp_seg, indice_print, confidence,
  score, category, flags jsonb)

generations(id, caixinha_id, suggestions jsonb, rag_examples_used uuid[],
  generated_at, model_version)

feedback(id, generation_id, suggestion_index,
  action: enum('like','edit','discard','copy'),
  final_text, created_at)
```

### 7.3 Fluxo end-to-end (vídeo novo)

```
1. Mobile upload (resumable) → POST /api/sessions → row em sessions(status='queued')
2. Worker (Inngest) consome job:
   2.1 Baixa vídeo do R2
   2.2 Chama Gemini 3 vídeo nativo com schema JSON
   2.3 Persiste caixinhas no DB
   2.4 Para cada caixinha → classifica (score+categoria) com prompt + RAG sample
   2.5 Atualiza sessions.status='ready', emite evento SSE
3. Frontend recebe SSE → exibe banner "✅ 17 caixinhas identificadas"
4. Usuário tap caixinha → POST /api/generate
   4.1 Backend: busca top-k vizinhos no pgvector via embedding da pergunta
   4.2 Busca top-N respostas aprovadas recentes
   4.3 Monta prompt → streaming via Gemini → SSE para frontend
5. Usuário 👍/✏️/📋 → POST /api/feedback
   5.1 Se action='copy' ou 'edit_then_copy' → INSERT em historical_qa com auto_import=true + embedding
6. TTL job diário: deleta videos do R2 com session.created_at > 7 dias
```

### 7.4 Abstrações-chave

- **`LLMVideoProvider`** (interface): permite trocar Gemini sem refatorar o resto.
  - Métodos: `extractCaixinhasFromVideo(url) → Caixinha[]`, `extractFromImages(urls[]) → Caixinha[]`.
- **`RAGRetriever`**: encapsula busca vetorial + re-ranking.
- **`PromptComposer`**: monta prompt com DNA + RAG + feedback recente em ordem definida.

---

## 8. Backlog de Histórias de Usuário

> Estilo "história lúdica" conforme aula: cada história desenha o usuário em ação. Critérios de aceite (CA) ao final.

### Épico E1 — Cadastro e DNA da Marca

**H1.1 — Como Camila, quero criar conta com Google em 1 toque para começar a usar sem digitar senha.**
> Camila abre o BoxIA pela primeira vez no Safari do iPhone. Vê o botão "Continuar com Google", toca, autentica em 2 segundos e cai direto no onboarding.
- CA: login Google funciona em iOS Safari e Android Chrome; sessão persiste 30d.

**H1.2 — Como Camila, quero subir um PDF do meu manual de marca para a IA aprender meu tom.**
> Ela tem um PDF de 4 páginas com o manual de marca. Toca em "Subir DNA", escolhe o PDF da galeria. Em 5s vê o texto extraído e pode editar antes de salvar.
- CA: PDF até 10MB processado em <8s; texto editável; salvo com versão.

**H1.3 — Como Dr. Rafael, quero colar 3 respostas minhas reais como exemplos de tom para reforçar o DNA.**
> Ele cola 3 respostas curtinhas no campo "Exemplos de tom". Sente que isso vai dar contexto extra à IA.
- CA: até 5 exemplos, 500 chars cada; salvos vinculados ao DNA.

---

### Épico E2 — Base Histórica de Q&A (RAG)

**H2.1 — Como Camila, quero subir 30 prints de caixinhas que já respondi para alimentar a IA com o meu jeito de escrever.**
> Ela seleciona 30 prints da galeria. O BoxIA processa todos e mostra "✅ 30 caixinhas identificadas". Para cada uma, a pergunta e a resposta dela já vêm extraídas. Ela revisa rapidinho, ajusta 2-3 e confirma.
- CA: batch de até 50 prints; extração de pergunta+resposta em prints com ≥90% acurácia em layout padrão IG; usuário pode editar antes de salvar.

**H2.2 — Como Camila, quero adicionar manualmente um par pergunta+resposta para casos rápidos.**
> No meio do dia ela lembra de uma resposta boa que deu. Abre o app, toca em "+ Adicionar", digita a pergunta e a resposta em 30s.
- CA: formulário com 2 campos; salva imediatamente; gera embedding em background.

**H2.3 — Como Camila, quero subir um vídeo antigo das minhas caixinhas e adicionar as respostas que dei.**
> Ela tem um vídeo do mês passado. Sobe com flag "histórico". O BoxIA extrai as perguntas. Para cada uma, ela cola/digita a resposta que deu.
- CA: pipeline de vídeo aceita flag `historical=true`; UI permite preencher resposta para cada caixinha extraída.

**H2.4 — Como Camila, quero ver minha biblioteca de respostas para auditar e remover pares fracos.**
> Ela abre "Minha biblioteca", busca por "produto", encontra 12 pares, remove 2 que estão fracos.
- CA: lista paginada; busca textual; ações de editar/remover; saúde da biblioteca exibida (badge verde a partir de 30 pares).

**H2.5 — Como sistema, quero gerar embedding ao salvar/editar par Q&A para que a busca semântica funcione.**
- CA: embedding gerado em <2s pós-save; índice IVFFlat ou HNSW no pgvector.

---

### Épico E3 — Upload e Processamento de Conteúdo Novo

**H3.1 — Como Camila, quero subir um vídeo de 6 minutos da minha tela navegando por caixinhas e o app processar sozinho.**
> No celular, no 4G, ela seleciona o vídeo. A barra de progresso anda. Em algum momento o sinal cai 5s — quando volta, o upload retoma de onde parou.
- CA: upload com retomada (tus.io); até 500MB e 15min; status real-time.

**H3.2 — Como Camila, quero subir 12 prints ao invés de gravar vídeo quando for mais rápido.**
- CA: batch upload de até 50 imagens; preview em grid; processa em paralelo.

**H3.3 — Como Camila, quero ver "✅ X caixinhas identificadas" sempre que terminar de processar.**
> Após processar, ela vê em destaque: "✅ 17 caixinhas identificadas neste vídeo de 4m23s". Ela confia que nada foi perdido.
- CA: contador é campo obrigatório no payload; banner persistente até a tela ser fechada.

**H3.4 — Como Camila, quero saber quanto cada processamento custou para controlar gastos.**
- CA: estimativa pré-processamento; custo real exibido pós; histórico de custos no dashboard.

---

### Épico E4 — Visualização e Classificação

**H4.1 — Como Camila, quero ver as caixinhas ordenadas pela mais relevante para responder primeiro o que importa.**
> Lista vem com a caixinha mais valiosa no topo (verde, score 87, categoria "oportunidade-lead"). Ruído fica colapsado embaixo.
- CA: ordenação por score desc default; categorias visíveis; ruído colapsado.

**H4.2 — Como Camila, quero filtrar por categoria para focar só em "dúvidas de produto" hoje.**
- CA: filtros de categoria + sinalizações (urgente, sensível, repetida).

**H4.3 — Como Camila, quero ver caixinhas marcadas como "sensíveis" com aviso para tratar com cuidado.**
- CA: caixinhas com `flags.sensível=true` exibem ícone de alerta + nota "Recomendamos resposta humana".

---

### Épico E5 — Geração de Resposta com RAG

**H5.1 — Como Camila, quero abrir uma caixinha e ver 3 sugestões de resposta no meu tom.**
> Toca no card. Abre bottom sheet. As 3 sugestões aparecem em streaming, primeira em <1s. Ela lê e pensa "essa segunda é exatamente como eu falaria".
- CA: 2-3 sugestões; TTFT <1s; respeitam limite de 280 chars.

**H5.2 — Como Camila, quero ver "Inspirado em" com os exemplos da minha biblioteca que guiaram a sugestão.**
- CA: link expansível; mostra 2-3 pares Q&A do RAG usados; transparência.

**H5.3 — Como Camila, quero copiar uma sugestão com 1 toque e haptic feedback.**
- CA: copy-to-clipboard; vibração curta no mobile; toast "Copiado".

**H5.4 — Como Camila, quero pedir para regenerar "mais curta" sem digitar.**
- CA: chips pré-prontos (mais curta, mais informal, mais técnica, com humor, +emoji, -emoji); campo livre opcional.

---

### Épico E6 — Feedback e Aprendizado Contínuo

**H6.1 — Como Camila, quero curtir uma sugestão com 1 toque para a IA saber que é boa.**
- CA: ação "👍" registra em `feedback`; pondera futuras gerações.

**H6.2 — Como Camila, quero editar uma sugestão antes de copiar e o app aprender com minha edição.**
- CA: textarea inline; texto final é capturado; entra como auto-import no RAG.

**H6.3 — Como sistema, quero adicionar automaticamente respostas usadas/editadas ao RAG histórico para fechar o ciclo de aprendizado.**
- CA: action='copy' ou 'edit_then_copy' → INSERT em `historical_qa` com `auto_import=true`; gera embedding.

**H6.4 — Como Camila, quero descartar sugestões ruins para a IA não repetir o erro.**
- CA: action='discard' reduz peso do exemplo do RAG correspondente nas próximas gerações.

---

### Épico E7 — Histórico e Métricas

**H7.1 — Como Camila, quero ver minha evolução: quantas caixinhas processei, % de respostas que usei.**
- CA: dashboard com totais e gráfico semanal de taxa de uso.

**H7.2 — Como Camila, quero exportar minha biblioteca para backup ou portabilidade (LGPD).**
- CA: export CSV/JSON em <30s.

---

## 9. Métricas de Sucesso

### 9.1 Ativação

| Métrica | Alvo |
|---|---|
| % usuários novos que processam ≥1 vídeo/print na 1ª semana | ≥60% |
| % usuários que adicionam ≥10 pares ao RAG histórico em 14 dias | ≥40% |

### 9.2 Qualidade da IA

| Métrica | Alvo |
|---|---|
| % de sugestões com ação "Usei essa" (após 3 sessões) | ≥60% |
| % de sugestões editadas antes de copiar | <30% |
| Tempo médio do upload até resposta final aceita | <90s por caixinha |

### 9.3 Retenção

| Métrica | Alvo |
|---|---|
| D7 retention | ≥40% |
| D30 retention | ≥25% |
| Sessões/usuário/semana (ativos) | ≥2 |

### 9.4 Eficiência

| Métrica | Alvo |
|---|---|
| Tempo p95 para processar vídeo de 5min | <3min |
| TTFT geração | <1s p95 |
| Custo médio por caixinha processada+respondida | <R$ 0,10 |

---

## 10. Restrições e Riscos

### 10.1 Custos de IA

- **Risco**: Gemini 3 com vídeo é caro. Usuário power pode estourar margem.
- **Mitigação**: cap mensal por plano; alertas de uso; otimização de prompts; cache de extrações.

### 10.2 Privacidade

- **Risco**: vídeo de tela do IG pode conter DMs visíveis no fundo, dados sensíveis, identidades de seguidores.
- **Mitigação**:
  - Aviso explícito antes do 1º upload.
  - Anonimização automática de @handles e nomes nos payloads.
  - TTL agressivo (default 7 dias) com botão de delete imediato.
  - Postgres com Row-Level Security; chaves de criptografia separadas por tenant em V2.

### 10.3 Conformidade Instagram

- **Risco**: Meta pode considerar produto "scraping" ou "automação não autorizada".
- **Mitigação**:
  - **Não usamos a API do Instagram**; nenhuma integração programática.
  - Usuário grava manualmente o próprio feed; produto opera sobre o vídeo do usuário.
  - Documentar isso em ToS e na landing page.

### 10.4 Qualidade da extração

- **Risco**: layout do IG muda; resoluções variadas iOS vs Android afetam OCR/visão.
- **Mitigação**:
  - Suite de testes visual com prints/vídeos de iOS e Android.
  - Validação de qualidade contínua (samples anonimizados em V2 com consent).
  - Fallback: usuário pode editar pergunta extraída se vier errada.

### 10.5 Lock-in com Gemini

- **Risco**: fornecedor único de IA = risco de preço/disponibilidade.
- **Mitigação**: abstração `LLMVideoProvider` desde o MVP; trocar fornecedor é mudança de adapter.

### 10.6 LGPD

- **Risco**: dados pessoais de seguidores capturados via prints.
- **Mitigação**:
  - Pipeline de anonimização antes do storage.
  - Termo de uso destaca responsabilidade do usuário-criador como controlador.
  - Direitos do titular (acesso, exclusão, portabilidade) implementados via export e delete.

### 10.7 Cold start do RAG

- **Risco**: usuário novo sem RAG histórico recebe respostas medianas e churna.
- **Mitigação**:
  - Onboarding ativo: tutorial de 5min para subir 20 prints.
  - Geração inicial usa apenas DNA + exemplos de tom (RF-1.5) com aviso na UI: "Adicione mais exemplos para melhorar".

---

## 11. Próximos Passos

Conforme metodologia incremental ensinada na aula referência:

1. **Validação deste PRD pelo PO** (você).
2. **Agente UX Designer** consome este PRD e produz **`UX_SPECS.md`** com fluxos detalhados, wireframes e padrões de componentes.
3. **Agente Arquiteto** consome PRD + UX_SPECS e produz **`ARCHITECTURE.md`** com diagramas de arquitetura, schema completo, contratos de API, padrões de pasta.
4. **Loop de revisão**: arquiteto pode pedir ajustes no PRD; PO revalida.
5. **Checklist de consistência** (PO) — todos os artefatos coerentes.
6. **Quebra em sprints**: Scrum Master converte o backlog (seção 8) em sprints com histórias detalhadas e critérios de pronto.
7. **Desenvolvimento por história** (ciclo dev → QA → review → próxima história).

> **Este PRD é incremental.** A cada loop de UX/arquitetura/dev, retornar a este documento e atualizá-lo. PRD não é o fim, é o ponto de partida que evolui.

---

**Versão**: 1.0
**Última atualização**: 2026-05-01
**Próxima revisão prevista**: após geração do `UX_SPECS.md`.
